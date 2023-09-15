import { User } from "./types";
import { Session } from 'next-auth';


type ConvertOption = 'session' | 'user';

export const convertSession = async (res: Response, option: ConvertOption) => {
    const data = res.json();
    const session: Session = JSON.parse(await data);
    const user: User = {
        username: session.user!.name!,
        id: session.accessToken!,
        avatar: session.user!.image!,
        email: session.user!.email!,
    };

    const convertedValue: Session | User = option === 'session' ? session : user;

    return convertedValue;
}