import { CONFIG } from 'src/config-global';

import { ProfileView } from 'src/sections/profile/view';

// ----------------------------------------------------------------------

// Mock user data for testing
const mockUser = {
  id: '1',
  displayName: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  avatarUrl: '/assets/images/avatar/avatar_1.jpg',
  coverUrl: '/assets/images/covers/cover_1.jpg',
  phone: '+84 123 456 789',
  location: 'Hồ Chí Minh, Vietnam',
  joinDate: 'Tham gia tháng 1, 2023',
  bio: 'Chuyên gia phát triển ứng dụng web với 5+ năm kinh nghiệm trong React, TypeScript và Material-UI.',
  currentPosition: 'Senior Developer',
  company: 'TechCorp Vietnam',
  skills: ['React', 'TypeScript', 'Material-UI', 'Node.js', 'MongoDB'],
  experience: [
    {
      position: 'Senior Frontend Developer',
      company: 'TechCorp Vietnam',
      period: '2022 - Hiện tại',
      description: 'Phát triển và bảo trì ứng dụng web lớn cho khách hàng doanh nghiệp'
    },
    {
      position: 'Frontend Developer',
      company: 'StartUp Innovate',
      period: '2020 - 2022',
      description: 'Xây dựng ứng dụng SaaS từ đầu sử dụng React và Node.js'
    }
  ],
  education: [
    {
      degree: 'Kỹ sư Công nghệ Thông tin',
      school: 'Đại học Bách Khoa TP.HCM',
      period: '2016 - 2020',
      description: 'Tốt nghiệp loại giỏi với điểm trung bình 3.8/4.0'
    }
  ],
  socialLinks: {
    linkedin: 'https://linkedin.com/in/nguyenvana',
    github: 'https://github.com/nguyenvana'
  },
  verified: false,
  cccdFront: '/demo_cccd.jpg',
  cccdBack: '/cccdms.png'
};

export default function Page() {
  return (
    <>
      <title>{`Profile - ${CONFIG.appName}`}</title>
      <ProfileView user={mockUser} />
    </>
  );
}