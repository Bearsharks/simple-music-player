let sequence = 0;
export default function keyGenerator(count = 1): string[] {
    return Array.from({ length: count }, () => `${Date.now()}_${sequence++}`);
}
