import Waveform from "@/components/svg/Waveform";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import Link from "next/link";
import { BsSoundwave } from "react-icons/bs";
import { FaAngleDown, FaMicrophoneAlt } from "react-icons/fa";
import { GiGuitarHead } from "react-icons/gi";
import { IconType } from "react-icons/lib";
import { LuUndoDot } from "react-icons/lu";
import { MdLoop } from "react-icons/md";
import { TiThMenu } from "react-icons/ti";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { auth } from "@clerk/nextjs/server";
import { RiAdminFill } from "react-icons/ri";


const extendedNavItems: NavItemExtend[] = [
    {
        name: "Yearbook",
        href: "/yearbook",
        items: [
            {
                name: "Guitars 2024",
                href: "/yearbook/guitar",
                description: "A collection of unique and original electric and acoustic guitar compositions and sounds from 2024.",
                icon: GiGuitarHead
            },
            {
                name: "Vocals 2024",
                href: "/yearbook/vocals",
                description: "Various vocal samples and recordings from 2024.",
                icon: FaMicrophoneAlt
            }
        ]
    },
    {
        name: "Sounds",
        href: "/sounds",
        items: [
            {
                name: "Miscellaneous",
                href: "/sounds/misc",
                description: "Add an extra layer of sound to your project with these miscellaneous sounds.",
                icon: BsSoundwave
            },
            {
                name: "Loops",
                href: "/sounds/loops",
                description: "Loopable sounds and samples.",
                icon: MdLoop
            },
            {
                name: "One Shots",
                href: "/sounds/one-shots",
                description: "Single shot sounds from real instruments and digital sources.",
                icon: LuUndoDot
            }
        ]
    },
]

const basicNavItems: NavItemBasic[] = [
    {
        name: "Policy",
        href: "/policy"
    },
    {
        name: "Partner",
        href: "/partner"
    }
]

type NavItemExtend = {
    name: string;
    href: string;
    items?: {
        name: string;
        href: string;
        description: string;
        icon?: IconType;
    }[]
}

type NavItemBasic = {
    name: string;
    href: string;
}

export default function Navbar() {
    return (
        <nav className="flex flex-row items-center justify-between w-full mx-0 my-0 relative">
            <div className="w-full flex justify-end my-2 mx-auto items-center">
                <div className="absolute left-0 flex items-center my-2 top-0">
                    <Link href="/" className="px-3 hover:scale-110 transition-transform">
                        <Waveform className="h-10 w-10" />
                    </Link>
                </div>

                <NavigationMenu className="nav-menu mx-10">
                    <NavigationMenuList className="gap-3">
                        {
                            basicNavItems.map((item, index) => (
                                <NavigationMenuItem key={index} className={navigationMenuTriggerStyle()}>
                                    <NavigationMenuLink href={item.href} className="text-base lg:text-lg xl:text-xl 2xl:text-2xl font-bold">
                                        {item.name}
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))
                        }
                        {
                            extendedNavItems.map((item, index) => (
                                <NavigationMenuItem key={index} className="w-full">
                                    <NavigationMenuTrigger className="text-base lg:text-lg xl:text-xl 2xl:text-2xl">
                                        <span className="px-3">
                                            {item.name}
                                        </span>
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent className="z-10">
                                        {
                                            item.items && item.items.map((subItem, subIndex) => (
                                                <NavigationMenuLink key={subIndex} href={subItem.href} className="flex flex-col hover:bg-zinc-800/60 justify-center py-2 w-max max-w-[12rem] items-start">
                                                    <div className="flex flex-row items-center gap-3 px-2 py-1 font-bold">
                                                        {subItem.icon && <subItem.icon className="h-10 w-10" />}
                                                        {subItem.name}
                                                    </div>
                                                    <div className="text-xs text-gray-400 px-2 py-1">
                                                        {subItem.description}
                                                    </div>
                                                </NavigationMenuLink>
                                            ))
                                        }
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            ))
                        }
                        <AuthBar />
                    </NavigationMenuList>
                </NavigationMenu>
                <div className="mobile-menu">
                    <MobileMenu />
                </div>
            </div>
        </nav>
    )
}

function MobileMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <span className="flex flex-row items-center justify-center">
                    <TiThMenu className="h-10 w-10" />
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-min">
                <DropdownMenuGroup>
                    {
                        basicNavItems.map((item, index) => (
                            <DropdownMenuItem key={index} className="">
                                <Link href={item.href}>
                                    {item.name}
                                </Link>
                            </DropdownMenuItem>
                        ))
                    }
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {
                    extendedNavItems.map((item, index) => (
                        <DropdownMenuGroup key={index}>
                            <DropdownMenuLabel className="font-mono uppercase tracking-wider flex flex-row gap-2">
                                {item.name} <FaAngleDown className="h-4 w-4" />
                            </DropdownMenuLabel>
                            {
                                item.items && item.items.map((subItem, subIndex) => (
                                    <DropdownMenuItem key={subIndex} className="">
                                        <Link href={subItem.href}>
                                            <div className="flex flex-row items-center gap-3">
                                                {subItem.icon && <subItem.icon className="h-6 w-6" />}
                                                {subItem.name}
                                            </div>
                                        </Link>
                                    </DropdownMenuItem>
                                ))
                            }
                            <DropdownMenuSeparator />
                        </DropdownMenuGroup>
                    ))
                }
                 <AuthBar />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

async function AuthBar() {
    const { sessionClaims, sessionId, userId } = auth();

    if (!sessionClaims || !sessionId || !userId) {
        return (
            <div>
                <Link href="/sign-in">
                    Sign In
                </Link>
            </div>
        )
    }

    if (sessionId || userId) {
        if (sessionClaims.metadata.role === "admin") {
            return (
                <div className="flex flex-col items-center gap-2">
                    <button className="bg-black rounded-lg px-3 py-2 focus:ring ring-blue-500 hover:bg-zinc-800/60 transition focus:ring-offset-1">
                        <Link href="/dashboard">
                            Dashboard
                        </Link>
                    </button>
                    <button className="bg-slate-700 rounded-lg px-3 py-2 focus:ring hover:bg-slate-800/60 transition focus:ring-offset-1 ring-blue-500">
                        <Link href="/admin">
                            <span className="flex flex-row gap-1 items-center">
                                Admin <RiAdminFill className="inline-block" />
                            </span>
                        </Link>
                    </button>
                </div>
            )
        }

        return (
            <div>
                <Link href="/dashboard">
                    Dashboard
                </Link>
            </div>
        )
    }
}