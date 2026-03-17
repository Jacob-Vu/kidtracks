/**
 * Default Template Packs - curated task lists by age/gender.
 * Parents import these as editable family templates.
 */

const DEFAULT_PACKS = [
    {
        id: 'little-star',
        name: 'Little Star',
        icon: '🐣',
        ageRange: '4-6',
        gender: 'neutral',
        description: 'Simple daily habits for little ones',
        color: '#f59e0b',
        tasks: [
            { title: 'Brush teeth (morning)', description: 'Brush for 2 minutes after breakfast', descriptionVi: 'Đánh răng 2 phút sau bữa sáng' },
            { title: 'Brush teeth (evening)', description: 'Brush before bedtime', descriptionVi: 'Đánh răng trước khi đi ngủ' },
            { title: 'Pick up toys', description: 'Put all toys back in their place', descriptionVi: 'Cất gọn tất cả đồ chơi về đúng chỗ' },
            { title: 'Wash hands before meals', description: 'Use soap and water', descriptionVi: 'Rửa tay bằng xà phòng trước bữa ăn' },
            { title: 'Drink water', description: 'Finish your water bottle today', descriptionVi: 'Uống hết bình nước hôm nay' },
        ],
    },
    {
        id: 'school-star',
        name: 'School Star',
        icon: '🎒',
        ageRange: '7-10',
        gender: 'neutral',
        description: 'Build strong school & homework habits',
        color: '#7c3aed',
        tasks: [
            { title: 'Make your bed', description: 'Neatly arrange your pillow and blanket', descriptionVi: 'Sắp xếp gối và chăn gọn gàng' },
            { title: 'Pack school bag', description: "Check tomorrow's schedule and pack books", descriptionVi: 'Kiểm tra thời khóa biểu và soạn cặp cho ngày mai' },
            { title: 'Do homework', description: 'Complete all assigned homework', descriptionVi: 'Hoàn thành đầy đủ bài tập được giao' },
            { title: 'Read for 15 minutes', description: 'Read a book or story of your choice', descriptionVi: 'Đọc sách hoặc truyện trong 15 phút' },
            { title: 'Brush teeth (AM & PM)', description: 'Morning and evening', descriptionVi: 'Đánh răng buổi sáng và buổi tối' },
        ],
    },
    {
        id: 'young-achiever',
        name: 'Young Achiever',
        icon: '📚',
        ageRange: '11-14',
        gender: 'neutral',
        description: 'Build independence and responsibility',
        color: '#06b6d4',
        tasks: [
            { title: 'Make bed & tidy room', description: 'Keep your space clean', descriptionVi: 'Dọn giường và giữ phòng gọn gàng' },
            { title: 'Complete all homework', description: 'Check each subject carefully', descriptionVi: 'Hoàn thành bài tập và kiểm tra kỹ từng môn' },
            { title: 'Read for 30 minutes', description: 'Books, articles, or educational content', descriptionVi: 'Đọc sách/tài liệu học tập trong 30 phút' },
            { title: 'Help with 1 household chore', description: 'Ask parent what needs doing', descriptionVi: 'Phụ giúp ít nhất 1 việc nhà' },
            { title: 'Limit screen time', description: 'Max 1 hour of entertainment screens', descriptionVi: 'Giới hạn thời gian giải trí màn hình tối đa 1 giờ' },
        ],
    },
    {
        id: 'active-boy',
        name: 'Active Boy',
        icon: '⚽',
        ageRange: '7-12',
        gender: 'boy',
        description: 'Stay active and develop healthy habits',
        color: '#10b981',
        tasks: [
            { title: 'Morning exercise', description: '10 minutes of stretches or jumping jacks', descriptionVi: 'Tập thể dục buổi sáng 10 phút' },
            { title: 'Practice sports', description: 'Football, basketball, or any sport - 30 min', descriptionVi: 'Chơi thể thao (bóng đá/bóng rổ...) trong 30 phút' },
            { title: 'Shower after play', description: 'Clean up after sports or outdoor play', descriptionVi: 'Tắm sạch sau khi chơi thể thao/ngoài trời' },
            { title: 'Drink enough water', description: 'At least 6 glasses throughout the day', descriptionVi: 'Uống đủ nước, ít nhất 6 ly/ngày' },
            { title: 'Tidy your room', description: 'Put things in their proper place', descriptionVi: 'Dọn phòng, để đồ đúng vị trí' },
        ],
    },
    {
        id: 'active-girl',
        name: 'Active Girl',
        icon: '💃',
        ageRange: '7-12',
        gender: 'girl',
        description: 'Stay active and develop healthy routines',
        color: '#ec4899',
        tasks: [
            { title: 'Morning stretch', description: '10 minutes of yoga or stretching', descriptionVi: 'Giãn cơ/yoga buổi sáng 10 phút' },
            { title: 'Dance or exercise', description: '30 minutes of movement you enjoy', descriptionVi: 'Nhảy múa hoặc vận động yêu thích trong 30 phút' },
            { title: 'Skincare routine', description: 'Wash face morning and night', descriptionVi: 'Rửa mặt sáng và tối' },
            { title: 'Organize desk & study area', description: 'Keep your workspace tidy', descriptionVi: 'Sắp xếp bàn học và góc học tập gọn gàng' },
            { title: 'Drink enough water', description: 'At least 6 glasses throughout the day', descriptionVi: 'Uống đủ nước, ít nhất 6 ly/ngày' },
        ],
    },
    {
        id: 'home-helper',
        name: 'Home Helper',
        icon: '🏠',
        ageRange: 'All ages',
        gender: 'neutral',
        description: 'Learn to contribute to the household',
        color: '#f97316',
        tasks: [
            { title: 'Set the table', description: 'Before lunch or dinner', descriptionVi: 'Dọn bàn ăn trước bữa trưa hoặc tối' },
            { title: 'Wash dishes', description: 'Or load/unload the dishwasher', descriptionVi: 'Rửa chén hoặc xếp/lấy chén đĩa khỏi máy rửa' },
            { title: 'Sweep the floor', description: 'Kitchen or living room', descriptionVi: 'Quét sàn bếp hoặc phòng khách' },
            { title: 'Take out trash', description: 'When the bin is full', descriptionVi: 'Đổ rác khi thùng đầy' },
            { title: 'Water the plants', description: 'Check which plants need water', descriptionVi: 'Tưới cây và kiểm tra cây nào cần nước' },
        ],
    },
]

export default DEFAULT_PACKS
