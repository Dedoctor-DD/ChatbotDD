import { LoginMobile } from './auth/LoginMobile';
import { LoginDesktop } from './auth/LoginDesktop';

interface LoginProps {
    onBack?: () => void;
}

export function Login(props: LoginProps) {
    return (
        <>
            <div className="md:hidden">
                <LoginMobile {...props} />
            </div>
            <div className="hidden md:block">
                <LoginDesktop {...props} />
            </div>
        </>
    );
}
