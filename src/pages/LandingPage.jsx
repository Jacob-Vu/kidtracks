import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../i18n/I18nContext'
import SocialProofSection from '../components/SocialProofSection'

const FEATURES = [
    {
        icon: '📋',
        en: { title: 'Daily task lists', desc: 'Assign age-appropriate tasks for each kid - from brushing teeth to finishing homework. Tailored per child, updated daily.' },
        vi: { title: 'Danh sách việc hằng ngày', desc: 'Giao việc phù hợp theo độ tuổi cho từng bé - từ đánh răng đến làm bài tập. Cá nhân hóa cho từng con, cập nhật mỗi ngày.' },
    },
    {
        icon: '💰',
        en: { title: 'Earn real pocket money', desc: 'Kids earn real rewards when they complete their tasks. Watch motivation go through the roof.' },
        vi: { title: 'Nhận tiền tiêu vặt thật', desc: 'Bé nhận phần thưởng thật khi hoàn thành nhiệm vụ. Động lực tăng vọt ngay lập tức.' },
    },
    {
        icon: '📊',
        en: { title: 'Track progress together', desc: 'See daily completion trends, celebrate streaks, and stay connected to your kids\' growth - all in one place.' },
        vi: { title: 'Theo dõi tiến trình cùng nhau', desc: 'Xem xu hướng hoàn thành hằng ngày, ăn mừng chuỗi thành tích và gắn kết với sự phát triển của con - tất cả trong một.' },
    },
]

const HOW = [
    { step: '1', en: 'Add your kids', vi: 'Thêm thông tin con' },
    { step: '2', en: 'Set daily tasks & rewards', vi: 'Giao việc & đặt thưởng' },
    { step: '3', en: 'Kids earn as they complete', vi: 'Bé làm xong, bé nhận thưởng' },
]

const PREVIEW_SLIDES = [
    {
        id: 'daily-tasks',
        type: 'tasks',
        title: { en: 'Daily task planning', vi: 'Lập kế hoạch việc mỗi ngày' },
        subtitle: { en: 'Keep routines clear and consistent', vi: 'Rõ ràng và đều đặn từng thói quen' },
        data: {
            kid: { avatar: '👧', name: 'An', money: '28,000đ', progress: '60%' },
            items: {
                en: ['✅ Practice piano', '⏳ Finish math sheet', '✅ Feed cat', '⏳ Journal writing'],
                vi: ['✅ Luyện piano', '⏳ Hoàn thành toán', '✅ Cho mèo ăn', '⏳ Viết nhật ký'],
            },
        },
    },
    {
        id: 'weekly-report',
        type: 'report',
        title: { en: 'Weekly performance report', vi: 'Báo cáo hiệu suất tuần' },
        subtitle: { en: 'See progress at a glance', vi: 'Nắm tiến độ toàn gia đình ngay lập tức' },
        data: {
            metrics: {
                en: [
                    { label: 'Family completion', value: '87%' },
                    { label: 'Tasks done', value: '61/70' },
                    { label: 'Best day', value: 'Thursday' },
                ],
                vi: [
                    { label: 'Hoàn thành gia đình', value: '87%' },
                    { label: 'Nhiệm vụ xong', value: '61/70' },
                    { label: 'Ngày tốt nhất', value: 'Thứ Năm' },
                ],
            },
            highlight: { en: 'Top insight: Homework consistency improved +18%', vi: 'Điểm nổi bật: Duy trì làm bài tập tăng +18%' },
        },
    },
    {
        id: 'gamification',
        type: 'gamification',
        title: { en: 'Gamification that motivates', vi: 'Gamification tạo động lực' },
        subtitle: { en: 'Streaks, badges, and celebration moments', vi: 'Chuỗi ngày, huy hiệu và khoảnh khắc ăn mừng' },
        data: {
            streak: { en: '🔥 6-day streak', vi: '🔥 Chuỗi 6 ngày' },
            badges: ['🎯', '⭐', '🏆', '🚀'],
            text: { en: 'New badge unlocked: Consistency Star', vi: 'Huy hiệu mới: Ngôi sao kiên trì' },
        },
    },
    {
        id: 'journal',
        type: 'journal',
        title: { en: 'Daily journal and reflection', vi: 'Nhật ký hằng ngày & phản tư' },
        subtitle: { en: 'Capture thoughts with text or voice', vi: 'Ghi lại cảm xúc bằng chữ hoặc giọng nói' },
        data: {
            entries: {
                en: ['🎙️ Voice note: “Today I finished all tasks.”', '📝 Parent note: Great effort after school.', '✅ Mood check: Happy and focused'],
                vi: ['🎙️ Ghi âm: “Hôm nay con hoàn thành hết việc.”', '📝 Ghi chú phụ huynh: Con cố gắng rất tốt sau giờ học.', '✅ Tâm trạng: Vui vẻ và tập trung'],
            },
        },
    },
    {
        id: 'templates',
        type: 'templates',
        title: { en: 'Task templates save setup time', vi: 'Mẫu công việc giúp tiết kiệm thời gian' },
        subtitle: { en: 'Import packs in one click', vi: 'Nhập bộ mẫu chỉ với một lần chạm' },
        data: {
            packs: {
                en: ['📦 Little Star · 5 tasks', '📦 School Star · 7 tasks', '📦 Home Helper · 6 tasks'],
                vi: ['📦 Ngôi sao nhỏ · 5 việc', '📦 Học trò giỏi · 7 việc', '📦 Trợ thủ gia đình · 6 việc'],
            },
        },
    },
    {
        id: 'goals',
        type: 'goals',
        title: { en: 'Savings goals with milestones', vi: 'Mục tiêu tiết kiệm có cột mốc' },
        subtitle: { en: 'Turn rewards into meaningful targets', vi: 'Biến phần thưởng thành mục tiêu có ý nghĩa' },
        data: {
            goal: {
                icon: '🚲',
                name: { en: 'New bicycle', vi: 'Xe đạp mới' },
                progress: 72,
                amount: { en: '$72 / $100', vi: '720.000đ / 1.000.000đ' },
            },
        },
    },
    {
        id: 'leaderboard',
        type: 'leaderboard',
        title: { en: 'Healthy competition leaderboard', vi: 'Bảng xếp hạng cạnh tranh tích cực' },
        subtitle: { en: 'Celebrate improvement for every kid', vi: 'Ghi nhận tiến bộ cho từng bé' },
        data: {
            rows: {
                en: ['🥇 Nemo · 92%', '🥈 Susu · 88%', '🥉 Minh · 81%'],
                vi: ['🥇 Nemo · 92%', '🥈 Susu · 88%', '🥉 Minh · 81%'],
            },
        },
    },
]

const SLIDE_META = {
    tasks: { icon: '📋', en: 'Tasks', vi: 'Việc hằng ngày' },
    report: { icon: '📊', en: 'Report', vi: 'Báo cáo' },
    gamification: { icon: '🎮', en: 'Gamification', vi: 'Gamification' },
    journal: { icon: '📝', en: 'Journal', vi: 'Nhật ký' },
    templates: { icon: '📦', en: 'Templates', vi: 'Mẫu việc' },
    goals: { icon: '🎯', en: 'Goals', vi: 'Mục tiêu' },
    leaderboard: { icon: '🏆', en: 'Leaderboard', vi: 'Xếp hạng' },
}

function SlideSnapshot({ slide, vi }) {
    if (slide.type === 'tasks') {
        return (
            <>
                <div className="landing-snapshot-row">
                    <span style={{ fontSize: 30 }}>{slide.data.kid.avatar}</span>
                    <div>
                        <div className="landing-snapshot-kid">{slide.data.kid.name}</div>
                        <div className="landing-snapshot-money">💰 {slide.data.kid.money}</div>
                    </div>
                    <div className="landing-snapshot-progress">{slide.data.kid.progress}</div>
                </div>
                <div className="landing-snapshot-list">
                    {(vi ? slide.data.items.vi : slide.data.items.en).map((item) => (
                        <div key={item} className="landing-snapshot-list__item">{item}</div>
                    ))}
                </div>
            </>
        )
    }

    if (slide.type === 'report') {
        return (
            <>
                <div className="landing-snapshot-metrics">
                    {(vi ? slide.data.metrics.vi : slide.data.metrics.en).map((metric) => (
                        <div key={metric.label} className="landing-snapshot-metric">
                            <div className="landing-snapshot-metric__label">{metric.label}</div>
                            <div className="landing-snapshot-metric__value">{metric.value}</div>
                        </div>
                    ))}
                </div>
                <div className="landing-snapshot-highlight">{vi ? slide.data.highlight.vi : slide.data.highlight.en}</div>
            </>
        )
    }

    if (slide.type === 'gamification') {
        return (
            <>
                <div className="landing-snapshot-streak">{vi ? slide.data.streak.vi : slide.data.streak.en}</div>
                <div className="landing-snapshot-badges">
                    {slide.data.badges.map((badge, idx) => <span key={`${badge}-${idx}`}>{badge}</span>)}
                </div>
                <div className="landing-snapshot-highlight">{vi ? slide.data.text.vi : slide.data.text.en}</div>
            </>
        )
    }

    if (slide.type === 'journal') {
        return (
            <div className="landing-snapshot-journal">
                {(vi ? slide.data.entries.vi : slide.data.entries.en).map((entry) => (
                    <div key={entry} className="landing-snapshot-journal__item">{entry}</div>
                ))}
            </div>
        )
    }

    if (slide.type === 'templates') {
        return (
            <div className="landing-snapshot-packs">
                {(vi ? slide.data.packs.vi : slide.data.packs.en).map((pack) => (
                    <div key={pack} className="landing-snapshot-pack">{pack}</div>
                ))}
            </div>
        )
    }

    if (slide.type === 'goals') {
        const progress = slide.data.goal.progress
        return (
            <div className="landing-snapshot-goal">
                <div className="landing-snapshot-goal__head">
                    <span style={{ fontSize: 26 }}>{slide.data.goal.icon}</span>
                    <div>
                        <div className="landing-snapshot-kid">{vi ? slide.data.goal.name.vi : slide.data.goal.name.en}</div>
                        <div className="landing-snapshot-money">{vi ? slide.data.goal.amount.vi : slide.data.goal.amount.en}</div>
                    </div>
                    <span className="landing-snapshot-progress">{progress}%</span>
                </div>
                <div className="landing-goal-progress">
                    <div className="landing-goal-progress__fill" style={{ width: `${progress}%` }} />
                </div>
            </div>
        )
    }

    return (
        <div className="landing-snapshot-leaderboard">
            {(vi ? slide.data.rows.vi : slide.data.rows.en).map((row) => (
                <div key={row} className="landing-snapshot-leaderboard__row">{row}</div>
            ))}
        </div>
    )
}

export default function LandingPage() {
    const navigate = useNavigate()
    const { lang } = useLang()
    const vi = lang === 'vi'
    const [activeSlide, setActiveSlide] = useState(0)
    const [paused, setPaused] = useState(false)

    useEffect(() => {
        if (paused) return undefined
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % PREVIEW_SLIDES.length)
        }, 3600)
        return () => clearInterval(timer)
    }, [paused])

    const goToSlide = (index) => setActiveSlide((index + PREVIEW_SLIDES.length) % PREVIEW_SLIDES.length)
    const slide = PREVIEW_SLIDES[activeSlide]

    return (
        <div className="landing">
            <header className="landing-nav">
                <div className="landing-logo">⭐ KidsTrack</div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
                    {vi ? 'Đăng nhập' : 'Sign in'}
                </button>
            </header>

            <section className="landing-hero">
                <div className="landing-hero-badge">
                    {vi ? '🇻🇳 Hỗ trợ Tiếng Việt & English' : '🇻🇳 Bilingual - Vietnamese & English'}
                </div>
                <h1 className="landing-headline">
                    {vi
                        ? <>Xây dựng thói quen tốt.<br />Khen thưởng mỗi kết quả.</>
                        : <>Build great habits.<br />Reward every win.</>
                    }
                </h1>
                <p className="landing-subhead">
                    {vi
                        ? 'KidsTrack giúp phụ huynh biến thói quen hằng ngày thành thành tích - với phần thưởng tiền tiêu vặt mà trẻ thực sự yêu thích.'
                        : 'KidsTrack helps parents turn daily routines into real achievements - with pocket money rewards kids actually love.'
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

                <SocialProofSection mode="trust" />

                <div className="landing-preview" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                    <div className={`landing-preview-card landing-preview-card--${slide.type}`}>
                        <div className="landing-preview-chip">
                            <span>{SLIDE_META[slide.type]?.icon}</span>
                            <span>{vi ? SLIDE_META[slide.type]?.vi : SLIDE_META[slide.type]?.en}</span>
                        </div>
                        <div className="landing-preview-stage" key={slide.id}>
                            <div className="landing-preview-headline">{vi ? slide.title.vi : slide.title.en}</div>
                            <div className="landing-preview-subtitle">{vi ? slide.subtitle.vi : slide.subtitle.en}</div>
                            <SlideSnapshot slide={slide} vi={vi} />
                        </div>
                        <div className="landing-slider-controls">
                            <button type="button" className="landing-slider-btn" onClick={() => goToSlide(activeSlide - 1)} aria-label={vi ? 'Slide trước' : 'Previous slide'}>‹</button>
                            <div className="landing-slider-dots">
                                {PREVIEW_SLIDES.map((item, index) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`landing-slider-dot${index === activeSlide ? ' active' : ''}`}
                                        onClick={() => goToSlide(index)}
                                        aria-label={`${vi ? 'Slide' : 'Slide'} ${index + 1}`}
                                    />
                                ))}
                            </div>
                            <button type="button" className="landing-slider-btn" onClick={() => goToSlide(activeSlide + 1)} aria-label={vi ? 'Slide sau' : 'Next slide'}>›</button>
                        </div>
                    </div>
                </div>
            </section>

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

            <SocialProofSection mode="extended" onPrimaryAction={() => navigate('/login')} />

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

            <footer className="landing-footer">
                <span>⭐ KidsTrack</span>
                <span>·</span>
                <span>{vi ? 'Miễn phí · Hoạt động trên mọi thiết bị' : 'Free · Works on all devices'}</span>
                <span>·</span>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
                    {vi ? 'Đăng nhập' : 'Sign in'}
                </button>
            </footer>
        </div>
    )
}
