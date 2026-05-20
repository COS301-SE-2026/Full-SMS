"use client"

function Avatar({ username }: { username: string}) {
    const initials = username
        .split("_")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return(
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-primary">{initials}</span>
        </div>
    )
}
export default function ProfilePage(){
    return(
        <div className="min-h-screen bg-background px-4 py-8 dark">
            <div className="max-w-lg mx-auto">
                <div className="flex flex-col items-center gap-3 mb-8">
                    <Avatar username="researcher_one" />
                    <div className="text-center">
                        <h1 className="text-xl font-semibold text-foreground">researcher_one</h1>
                        <p className="text-sm text-foreground/60">researcher_one@up.ac.za</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

