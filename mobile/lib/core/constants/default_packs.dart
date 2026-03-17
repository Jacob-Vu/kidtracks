class DefaultTaskPack {
  const DefaultTaskPack({
    required this.id,
    required this.nameEn,
    required this.nameVi,
    required this.descriptionEn,
    required this.descriptionVi,
    required this.icon,
    required this.ageRange,
    required this.gender,
    required this.colorHex,
    required this.tasks,
  });

  final String id;
  final String nameEn;
  final String nameVi;
  final String descriptionEn;
  final String descriptionVi;
  final String icon;
  final String ageRange;
  final String gender;
  final String colorHex;
  final List<DefaultPackTask> tasks;
}

class DefaultPackTask {
  const DefaultPackTask({
    required this.titleEn,
    required this.titleVi,
    required this.descriptionEn,
    required this.descriptionVi,
  });

  final String titleEn;
  final String titleVi;
  final String descriptionEn;
  final String descriptionVi;
}

const defaultTaskPacks = <DefaultTaskPack>[
  DefaultTaskPack(
    id: 'little-star',
    nameEn: 'Little Star',
    nameVi: 'Ngoi sao nho',
    descriptionEn: 'Simple daily habits for little ones',
    descriptionVi: 'Thoi quen don gian cho be',
    icon: '🐣',
    ageRange: '4-6',
    gender: 'neutral',
    colorHex: '#F59E0B',
    tasks: [
      DefaultPackTask(
        titleEn: 'Brush teeth (morning)',
        titleVi: 'Danh rang buoi sang',
        descriptionEn: 'Brush for 2 minutes after breakfast',
        descriptionVi: 'Danh rang 2 phut sau bua sang',
      ),
      DefaultPackTask(
        titleEn: 'Pick up toys',
        titleVi: 'Don do choi',
        descriptionEn: 'Put all toys back in their place',
        descriptionVi: 'Cat do choi dung vi tri',
      ),
    ],
  ),
  DefaultTaskPack(
    id: 'school-star',
    nameEn: 'School Star',
    nameVi: 'Hoc tro gioi',
    descriptionEn: 'Build strong school and homework habits',
    descriptionVi: 'Xay dung thoi quen hoc tap tot',
    icon: '🎒',
    ageRange: '7-10',
    gender: 'neutral',
    colorHex: '#7C3AED',
    tasks: [
      DefaultPackTask(
        titleEn: 'Make your bed',
        titleVi: 'Don giuong',
        descriptionEn: 'Neatly arrange your pillow and blanket',
        descriptionVi: 'Sap xep goi va chan gon gang',
      ),
      DefaultPackTask(
        titleEn: 'Do homework',
        titleVi: 'Lam bai tap',
        descriptionEn: 'Complete all assigned homework',
        descriptionVi: 'Hoan thanh toan bo bai tap',
      ),
    ],
  ),
  DefaultTaskPack(
    id: 'home-helper',
    nameEn: 'Home Helper',
    nameVi: 'Tro thu gia dinh',
    descriptionEn: 'Learn to contribute to the household',
    descriptionVi: 'Hoc cach dong gop cho gia dinh',
    icon: '🏠',
    ageRange: 'All ages',
    gender: 'neutral',
    colorHex: '#F97316',
    tasks: [
      DefaultPackTask(
        titleEn: 'Set the table',
        titleVi: 'Bay ban an',
        descriptionEn: 'Before lunch or dinner',
        descriptionVi: 'Truoc bua trua hoac bua toi',
      ),
      DefaultPackTask(
        titleEn: 'Water the plants',
        titleVi: 'Tuoi cay',
        descriptionEn: 'Check which plants need water',
        descriptionVi: 'Kiem tra cay nao can tuoi',
      ),
    ],
  ),
];

