import { useNavigate } from 'react-router-dom'
import { useLang } from '../i18n/I18nContext'

const FEATURES = [
    {
        icon: '📋',
        en: { title: 'Daily task lists', desc: 'Assign age-appropriate tasks for each kid — from brushing teeth to finishing homework. Tailored per child, updated daily.' },
        vi: { title: 'Danh sách việc hàng ngày', desc: 'Giao việc phù hợp theo độ tuổi cho từng bé — từ đánh răng đến làm bài tập. Cá nhân hoá cho từng con, cập nhật mỗi ngày.' },
    },
    {
        icon: '💰',
        en: { title: 'Earn real pocket money', desc: 'Kids earn real rewards when they complete their tasks. Watch motivation go through the roof.' },
        vi: { title: 'Nhận tiền tiêu vặt thật', desc: 'Bé nhận phần thưởng thật khi hoàn thành nhiệm vụ. Động lực tăng vọt ngay lập tức.' },
    },
    {
        icon: '📊',
        en: { title: 'Track progress together', desc: 'See daily completion trends, celebrate streaks, and stay connected to your kids\' growth — all in one place.' },
        vi: { title: 'Theo dõi tiến trình cùng nhau', desc: 'Xem xu hướng hoàn thành hàng ngày, ăn mừng chuỗi thành tích và gắn kết với sự phát triển của con — tất cả trong một.' },
    },
]

const HOW = [
    { step: '1', en: 'Add your kids', vi: 'Thêm thông tin con' },
    { step: '2', en: 'Set daily tasks & rewards', vi: 'Giao việc & đặt thưởng' },
    { step: '3', en: 'Kids earn as they complete', vi: 'Bé làm xong, bé nhận thưởng' },
]

export default function LandingPage() {
    const navigate = useNavigate()
    const { lang } = useLang()
    const vi = lang === 'vi'

    return (
        <div className="landing">
            {/* Nav */}
            <header className="landing-nav">
                <div className="landing-logo">⭐ KidsTrack</div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>
                    {vi ? 'Đăng nhập' : 'Sign in'}
                </button>
            </header>

            {/* Hero */}
            <section className="landing-hero">
                <div className="landing-hero-badge">
                    {vi ? '🇻🇳 Hỗ trợ Tiếng Việt & English' : '🇻🇳 Bilingual — Vietnamese & English'}
                </div>
                <h1 className="landing-headline">
                    {vi
                        ? <>Xây dựng thói quen tốt.<br />Khen thưởng mỗi kết quả.</>
                        : <>Build great habits.<br />Reward every win.</>
                    }
                </h1>
                <p className="landing-subhead">
                    {vi
                        ? 'KidsTrack giúp phụ huynh biến thói quen hàng ngày thành thành tích — với phần thưởng tiền tiêu vặt mà trẻ thực sự yêu thích.'
                        : 'KidsTrack helps parents turn daily routines into real achievements — with pocket money rewards kids actually love.'
                    }
                </p>
                <div className="landing-ctas">
                    <button className="btn btn-primary landing-cta-primary" onClick={() => navigate('/login')}>
                        {vi ? '🚀 Bắt đầu miễn phí' : '🚀 Start free'}
                    </button>
                    <span className="landing-cta-hint">
                        {vi ? 'Không cần thẻ tín dụng · Chỉ 30 giây' : 'No credit card · Takes 30 seconds'}
                    </span>
                </div>

                {/* Mini preview */}
                <div className="landing-preview">
                    <div className="landing-preview-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <span style={{ fontSize: 28 }}>🧒</span>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>Minh</div>
                                <div style={{ fontSize: 12, color: 'var(--accent-amber)' }}>💰 35,000đ</div>
                            </div>
                            <div style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--accent-green)', fontSize: 22 }}>80%</div>
                        </div>
                        {[
                            { done: true,  text: vi ? '✅ Dọn giường' : '✅ Make bed' },
                            { done: true,  text: vi ? '✅ Làm bài tập' : '✅ Do homework' },
                            { done: false, text: vi ? '⏳ Đọc sách 15 phút' : '⏳ Read 15 minutes' },
                            { done: true,  text: vi ? '✅ Đánh răng' : '✅ Brush teeth' },
                        ].map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '6px 0', opacity: item.done ? 1 : 0.6,
                                borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
                                fontSize: 13,
                            }}>
                                {item.text}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="landing-features">
                <h2 className="landing-section-title">
                    {vi ? 'Tại sao phụ huynh chọn KidsTrack?' : 'Why parents choose KidsTrack'}
                </h2>
                <div className="landing-features-grid">
                    {FEATURES.map((f) => (
                        <div key={f.icon} className="landing-feature-card">
                            <div className="landing-feature-icon">{f.icon}</div>
                            <h3 className="landing-feature-title">{vi ? f.vi.title : f.en.title}</h3>
                            <p className="landing-feature-desc">{vi ? f.vi.desc : f.en.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="landing-how">
                <h2 className="landing-section-title">
                    {vi ? 'Bắt đầu trong 3 bước' : '3 steps to get started'}
                </h2>
                <div className="landing-steps">
                    {HOW.map((h, i) => (
                        <div key={h.step} className="landing-step">
                            <div className="landing-step-num">{h.step}</div>
                            <div className="landing-step-text">{vi ? h.vi : h.en}</div>
                            {i < HOW.length - 1 && <div className="landing-step-arrow">→</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="landing-bottom-cta">
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 12 }}>
                    {vi ? 'Sẵn sàng động viên con bạn? ⭐' : 'Ready to motivate your kids? ⭐'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 28, maxWidth: 480 }}>
                    {vi
                        ? 'Tham gia cùng các gia đình đang dùng KidsTrack để xây dựng thói quen tốt và trao thưởng mỗi ngày.'
                        : 'Join families using KidsTrack to build great habits and celebrate every achievement.'
                    }
                </p>
                <button className="btn btn-primary landing-cta-primary" onClick={() => navigate('/login')}>
                    {vi ? '🚀 Tạo tài khoản miễn phí' : '🚀 Create free account'}
                </button>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <span>⭐ KidsTrack</span>
                <span>·</span>
                <span>{vi ? 'Miễn phí · Hoạt động trên mọi thiết bị' : 'Free · Works on all devices'}</span>
                <span>·</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>
                    {vi ? 'Đăng nhập' : 'Sign in'}
                </button>
            </footer>
        </div>
    )
}
