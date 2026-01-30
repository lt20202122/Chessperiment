"use client"

import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase-client"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

interface SignUpFormProps {
    onSwitchToLogin: () => void
}

export default function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
    // We can use the same translation namespace "Auth" if appropriate, 
    // or fall back to hardcoded strings if translations aren't ready. 
    // Assuming "Auth" namespace exists from LoginPage usage.
    const t = useTranslations("Auth")
    const router = useRouter()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (password !== confirmPassword) {
            setError(t("passwordsDoNotMatch")) // You might need to add this key or use a fallback
            return
        }
        if (password.length < 6) {
            setError(t("passwordTooShort")) // Firebase requires 6 chars
            return
        }

        setLoading(true)

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Send Verification Email
            try {
                // Dynamic import or check if available to avoid errors if configured differently
                const { sendEmailVerification } = await import("firebase/auth")
                await sendEmailVerification(user)
            } catch (emailErr) {
                console.warn("Failed to send verification email:", emailErr)
            }

            // 2. Update Profile
            if (displayName) {
                await updateProfile(user, { displayName })
            }

            // 3. Create Firestore Document
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                displayName: displayName || null,
                createdAt: serverTimestamp(),
                authProvider: "email",
                uid: user.uid,
                photoURL: user.photoURL || null,
            })

            // Redirect to home
            router.push("/")

            // 4. Redirect is handled by the auth state listener or parent component usually,
            // but for now we can just let the state change propagate.
            // NextAuth might interfere if it's the only thing checking session.
            // If strictly using Firebase Auth, the app should listen to onAuthStateChanged.
            // If using NextAuth, we might need to "signIn" with credentials.
            // For now, following the plan which implies just creating the user is enough 
            // and assuming the app handles the auth state.

        } catch (err: any) {
            console.error(err)
            // Map Firebase errors to user-friendly messages
            // This is a simplified mapping.
            if (err.code === "auth/email-already-in-use") {
                setError(t("emailAlreadyInUse"))
            } else if (err.code === "auth/invalid-email") {
                setError(t("invalidEmail"))
            } else if (err.code === "auth/weak-password") {
                setError(t("weakPassword"))
            } else {
                setError(err.message || t("signUpError"))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{t("createAccount")}</h2>

            {/* Display Name */}
            <div className="space-y-1">
                <label className="text-white/60 text-sm ml-1">{t("displayName")}</label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder={t("displayNamePlaceholder")}
                />
            </div>

            {/* Email */}
            <div className="space-y-1">
                <label className="text-white/60 text-sm ml-1">{t("email")}</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        setError(null)
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="name@example.com"
                />
            </div>

            {/* Password */}
            <div className="space-y-1 relative">
                <label className="text-white/60 text-sm ml-1">{t("password")}</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setError(null)
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all pr-10"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1 relative">
                <label className="text-white/60 text-sm ml-1">{t("confirmPassword")}</label>
                <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setError(null)
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="••••••••"
                />
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium text-center animate-shake">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-4"
            >
                {loading ? <Loader2 className="animate-spin" /> : t("signUp")}
            </button>

            <div className="text-center mt-6">
                <p className="text-white/50 text-sm">
                    {t("alreadyHaveAccount")}{" "}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-amber-400 hover:text-amber-300 font-semibold hover:underline transition-all"
                    >
                        {t("signIn")}
                    </button>
                </p>
            </div>
        </form>
    )
}
