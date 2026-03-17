import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;

import '../models/user_profile.dart';
import 'id_service.dart';

class AuthService {
  AuthService(this._auth, this._db);

  final FirebaseAuth _auth;
  final FirebaseFirestore _db;

  static String sanitizeEmail(String email) =>
      email.toLowerCase().replaceAll('.', ',');

  static String kidAuthEmail(String username, String familyId) =>
      '${username.toLowerCase()}@$familyId.kidstrack';

  Stream<User?> authStateChanges() => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  Future<UserProfile?> fetchProfile(String uid) async {
    final snap = await _db.collection('userProfiles').doc(uid).get();
    if (!snap.exists) return null;
    return UserProfile.fromMap(snap.data()!);
  }

  Future<({User user, bool isNew})> signInWithGoogle() async {
    final googleUser = await GoogleSignIn().signIn();
    if (googleUser == null) {
      throw FirebaseAuthException(code: 'sign_in_canceled');
    }

    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );
    final result = await _auth.signInWithCredential(credential);
    final user = result.user!;
    final profile = await fetchProfile(user.uid);
    return (user: user, isNew: profile == null);
  }

  Future<({User user, bool isNew})> signInParentEmail(
    String email,
    String password,
  ) async {
    final result = await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
    final user = result.user!;
    final profile = await fetchProfile(user.uid);
    return (user: user, isNew: profile == null);
  }

  Future<({User user, bool isNew})> signUpParentEmail(
    String email,
    String password,
  ) async {
    final result = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    return (user: result.user!, isNew: true);
  }

  Future<String> createFamily(User user, String familyName) async {
    final familyId = IdService.generate();
    await _db.collection('families').doc(familyId).set({
      'name': familyName,
      'parentUids': [user.uid],
      'createdAt': DateTime.now().toIso8601String(),
    });
    await _db.collection('userProfiles').doc(user.uid).set({
      'role': 'parent',
      'familyId': familyId,
      'displayName': user.displayName ?? 'Parent',
      'email': user.email,
    });
    await _db.collection('parentEmailLookup').doc(sanitizeEmail(user.email!)).set({
      'familyId': familyId,
      'parentName': user.displayName ?? 'Parent',
    });
    return familyId;
  }

  Future<Map<String, dynamic>> lookupFamilyByParentEmail(String email) async {
    final snap =
        await _db.collection('parentEmailLookup').doc(sanitizeEmail(email)).get();
    if (!snap.exists) {
      throw Exception('Family not found');
    }
    return snap.data()!;
  }

  Future<User> signInKid(
    String username,
    String password,
    String familyId,
  ) async {
    final email = kidAuthEmail(username, familyId);
    final result = await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
    return result.user!;
  }

  Future<String> createKidAuthAccount({
    required String username,
    required String password,
    required String familyId,
    required String apiKey,
  }) async {
    final email = kidAuthEmail(username, familyId);
    final response = await http.post(
      Uri.parse(
        'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$apiKey',
      ),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'returnSecureToken': false,
      }),
    );

    if (!response.statusCode.toString().startsWith('2')) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final message = body['error']?['message'] as String? ?? 'Failed to create';
      if (message == 'EMAIL_EXISTS') {
        throw Exception('That username is already taken.');
      }
      throw Exception(message);
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    return body['localId'] as String;
  }

  Future<void> createKidProfile({
    required String familyId,
    required String kidUid,
    required String kidId,
    required String displayName,
    required String username,
    required String avatar,
  }) async {
    await _db.collection('families').doc(familyId).collection('kids').doc(kidId).set({
      'id': kidId,
      'displayName': displayName,
      'name': displayName,
      'username': username,
      'avatar': avatar,
      'balance': 0,
    });
    await _db.collection('userProfiles').doc(kidUid).set({
      'role': 'kid',
      'familyId': familyId,
      'kidId': kidId,
      'username': username,
      'displayName': displayName,
      'email': kidAuthEmail(username, familyId),
    });
  }

  Future<void> updateKidDocument({
    required String familyId,
    required String kidId,
    required Map<String, dynamic> data,
  }) {
    return _db
        .collection('families')
        .doc(familyId)
        .collection('kids')
        .doc(kidId)
        .set(data, SetOptions(merge: true));
  }

  Future<void> changeKidPassword(
    String currentPassword,
    String newPassword,
  ) async {
    final user = _auth.currentUser;
    if (user == null || user.email == null) throw Exception('Not signed in');
    final credential = EmailAuthProvider.credential(user.email!, currentPassword);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);
  }

  Future<void> linkKidEmail(String currentPassword, String newEmail) async {
    final user = _auth.currentUser;
    if (user == null || user.email == null) throw Exception('Not signed in');
    final credential = EmailAuthProvider.credential(user.email!, currentPassword);
    await user.reauthenticateWithCredential(credential);
    await user.verifyBeforeUpdateEmail(newEmail);
    await _db.collection('userProfiles').doc(user.uid).set(
      {'linkedEmail': newEmail, 'email': newEmail},
      SetOptions(merge: true),
    );
  }

  Future<void> signOut() => _auth.signOut();
}

