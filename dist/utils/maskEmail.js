export function maskEmail(email) {
    const [name, domain] = email.split('@');
    if (!name || !domain)
        return email;
    if (name.length <= 4) {
        return `${name[0] ?? '*'}${'*'.repeat(Math.max(2, name.length - 1))}@${domain}`;
    }
    const prefix = name.slice(0, Math.min(3, name.length));
    const suffix = name.slice(-2);
    const maskLength = Math.max(2, name.length - prefix.length - suffix.length);
    return `${prefix}${'*'.repeat(maskLength)}${suffix}@${domain}`;
}
//# sourceMappingURL=maskEmail.js.map