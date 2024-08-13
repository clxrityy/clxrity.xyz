import "@/styles/waveform.css";

export function Waveform() {
    return (
        <section className="waves">
            <div className="wave0" />
            <div className="wave1" />
            <div className="wave2" />
            <div className="wave3" />
            <div className="wave4" />
            <div className="wave5" />
            <div className="wave6" />
            <div className="wave7" />
            <div className="wave8" />
            <div className="wave9" />
            <div className="wave10" />
            <div className="wave11" />
            <div className="wave12" />
        </section>
    )
}

export default function WaveformAnimation() {
    return (
        <div className="flex flex-row">
            <Waveform />
        </div>
    )
}