import "@/styles/background.css";
import Image from "next/image";

export default async function Background() {
    return (
        <div className="background">
            <Image className="background-img" alt="music table background" src={"/assets/img/musictable.webp"} width={1500} height={1500} style={{
                objectFit: "cover",
                objectPosition: "center",
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: -1
            }} />
        </div>
    )
}