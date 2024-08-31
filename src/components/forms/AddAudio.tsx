"use client";
import { Genres, Instruments, Keys, MaxBPM, MinBPM, Moods } from "@/types/audio";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectTrigger, SelectValue, SelectLabel, SelectItem } from "@/components/ui/select";
import UploadForm from "./Upload";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { upload } from "@/app/(actions)/uploads";
import { AudioTypes } from "@/types/data";
import { v4 as uuid } from "uuid";

// ICONS
import { BiUpload } from "react-icons/bi";
import { IoMdDoneAll } from "react-icons/io";



export const formSchema = z.object({
    title: z.string().min(4,
        { message: "Title must be at least 4 characters" }
    ).max(24, {
        message: "Title cannot be longer than 24 characters",
    }),
    description: z.string().max(256, {
        message: "Description cannot be longer than 256 characters",
    }).optional(),
    genre: z.string().optional(),
    mood: z.string().optional(),
    key: z.string({
        message: "The key is required, select unknown if unsure",
    }),
    bpm: z.number().min(MinBPM, {
        message: `BPM must be at least ${MinBPM}`,
    }).max(MaxBPM, {
        message: `BPM cannot be higher than ${MaxBPM}`,
    }).optional(),
    instrument: z.string({
        message: "Instrument is required, select other if unapplicable",
    }),
    file: z.string().url(),
    userId: z.string(),
    timestamp: z.number().default(new Date().getTime()),
    audioType: z.string().optional(),
    username: z.string(),
    uuid: z.string(),
});


export default function AddAudioForm() {

    const { user } = useUser();


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            userId: user?.id,
            timestamp: Date.now(),
            username: user?.username || user?.fullName || "unknown",
            uuid: uuid(),
        },
    });

    async function onSubmit(data: z.infer<typeof formSchema>) {

        const hardRefresh = () => {
            window.location.reload();
        }

        try {
            const doc = await upload(data);

            if (!doc) {
                toast.error("Audio could not be uploaded, please try again later");
            }
            toast.success(`${data.title} uploaded!`, {
                icon: <IoMdDoneAll size={18} className="text-green-700" />,
            });

            setTimeout(hardRefresh, 1000);
        } catch (e) {
            console.error(e);
            toast.error("An error occurred, please try again later");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 items-center justify-stretch w-full my-5">
                {/**
                 * 1. TITLE, DESCRIPTION
                 */}
                <div className="flex flex-col md:flex-row gap-4 w-full items-stretch justify-stretch">
                    {/**
                     * TITLE
                     */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem className="w-full md:w-1/4">
                                <FormLabel>
                                    Title
                                </FormLabel>
                                <FormControl className="text-gray-300/90">
                                    <Input placeholder="Title" {...field} />
                                </FormControl>
                                <FormMessage className="text-red-500" />
                            </FormItem>
                        )}
                    />
                    {/**
                     * DESCRIPTION
                     */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className="flex flex-row gap-1 items-center">
                                    Description
                                    <Optional />
                                </FormLabel>
                                <FormControl className="text-gray-300/90">
                                    <Textarea className="w-80 max-h-40 min-h-20" placeholder="Description" {...field} />
                                </FormControl>
                                <FormMessage className="text-red-500" />
                            </FormItem>
                        )}
                    />
                    {/**
                     * AUDIO TYPE
                     */}
                    <FormField
                        control={form.control}
                        name="audioType"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className="flex flex-row gap-1 items-center">
                                    Audio Type
                                    <Optional />
                                </FormLabel>
                                <FormControl className="text-gray-300/90">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className="text-gray-300/90">
                                            <SelectValue placeholder="Select an audio type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>
                                                    Audio Types
                                                </SelectLabel>
                                                {
                                                    Object.values(AudioTypes).map((audioType, idx) => (
                                                        <SelectItem key={idx} value={audioType}>
                                                            {audioType}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                {/**
                 * 2. GENRE, MOOD, INSTRUMENT
                 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-center justify-stretch w-full gap-4">
                    {/**
                     * GENRE
                     */}
                    <FormField
                        control={form.control}
                        name="genre"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex flex-row gap-1 items-center">
                                    Genre
                                    <Optional />
                                </FormLabel>
                                <FormControl>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className="text-gray-300/90">
                                            <SelectValue placeholder="Select a genre" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>
                                                    Genres
                                                </SelectLabel>
                                                {
                                                    Object.values(Genres).map((genre, idx) => (
                                                        <SelectItem key={idx} value={genre}>
                                                            {genre}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    {/**
                     * MOOD
                     */}
                    <FormField
                        control={form.control}
                        name="mood"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex flex-row gap-1 items-center">
                                    Mood
                                    <Optional />
                                </FormLabel>
                                <FormControl>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className="text-gray-300/90">
                                            <SelectValue placeholder="Select a mood" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>
                                                    Moods
                                                </SelectLabel>
                                                {
                                                    Object.values(Moods).map((mood, idx) => (
                                                        <SelectItem key={idx} value={mood}>
                                                            {mood}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    {/**
                     * INSTRUMENT
                     */}
                    <FormField
                        control={form.control}
                        name="instrument"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Instrument
                                </FormLabel>
                                <FormControl>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className="text-gray-300/90">
                                            <SelectValue placeholder="Select an instrument" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>
                                                    Instruments
                                                </SelectLabel>
                                                {
                                                    Object.values(Instruments).map((instrument, idx) => (
                                                        <SelectItem key={idx} value={instrument}>
                                                            {instrument}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                {/**
                 * 3. KEY, BPM
                 */}
                <div className="flex flex-col lg:flex-row items-center justify-stretch w-full gap-4">
                    {/**
                     * KEY
                     */}
                    <FormField
                        control={form.control}
                        name="key"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Key
                                </FormLabel>
                                <FormControl>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className="text-gray-300/90">
                                            <SelectValue placeholder="Select a key" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>
                                                    Keys
                                                </SelectLabel>
                                                {
                                                    Object.values(Keys).map((key, idx) => (
                                                        <SelectItem key={idx} value={key}>
                                                            {key}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/**
                     * BPM
                     */}
                    <FormField
                        control={form.control}
                        name="bpm"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex flex-row gap-1 items-center">
                                    BPM
                                    <Optional />
                                </FormLabel>
                                <FormControl className="text-gray-300/90">
                                    <Input type="number" placeholder="BPM" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage className="text-red-500" />
                            </FormItem>
                        )}
                    />
                </div>
                {/**
                 * 4. UPLOAD FORM
                 */}
                {user && <UploadForm formData={form} userId={user.id} />}
                {/**
                 * 5. SUBMIT
                 */}
                <Button type="submit" className="w-3/5 flex flex-row items-center text-center font-bold text-lg" variant={"secondary"}>
                    <BiUpload className="mr-2" size={18} />
                    Upload
                </Button>
            </form>
        </Form>
    );
}

function Optional() {
    return <span className="text-gray-400">
        (optional)
    </span>
}