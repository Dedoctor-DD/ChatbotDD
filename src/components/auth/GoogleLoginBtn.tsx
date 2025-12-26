interface GoogleLoginBtnProps {
    onClick: () => void;
    isLoading: boolean;
}

export function GoogleLoginBtn({ onClick, isLoading }: GoogleLoginBtnProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isLoading}
            className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest border border-gray-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70 active:scale-95 group"
        >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Google</span>
        </button>
    );
}
