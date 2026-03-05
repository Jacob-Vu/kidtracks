export function formatMoney(amount) {
    if (amount === 0) return '0đ'
    if (amount >= 1000000) return (amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1) + 'M'
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'k'
    return amount + 'đ'
}

export function formatMoneyFull(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}
