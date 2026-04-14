// Auth protection is handled in app/(dashboard)/layout.tsx via getServerSession
// No middleware needed — avoids Edge runtime JWT issues
export const config = { matcher: [] }
