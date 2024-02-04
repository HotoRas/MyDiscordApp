export function TrimUserId(name: string): string {
    return name.endsWith('#0') ? name.slice(0, -2) : name
}