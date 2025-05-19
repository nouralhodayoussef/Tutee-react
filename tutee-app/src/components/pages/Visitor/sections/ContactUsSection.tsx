"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactUsSection() {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        universityName: "",
        description: "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const res = await fetch("http://localhost:4000/api/visitor/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        if (res.ok) {
            setSuccess("Feedback sent! Thank you.");
            setForm({
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                universityName: "",
                description: "",
            });
        } else {
            const data = await res.json();
            setError(data?.error || "Something went wrong!");
        }
        setLoading(false);
    };

    return (
        <motion.section
            id="contact-us"
            className="w-full flex justify-center items-center py-12 px-4"
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <motion.form
                style={{
                    background: "radial-gradient(circle at 60% 10%, #f3cc7b 0%, #E8B14F 100%)",
                }}
                className="w-full max-w-2xl rounded-[48px] bg-[#E8B14F]/90 px-6 py-8 sm:px-12 shadow-lg flex flex-col items-center"
                onSubmit={handleSubmit}
                initial={{ scale: 0.97, opacity: 0.9 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <h2 className="text-2xl sm:text-3xl font-bold text-black text-center mb-2">Contact Us</h2>
                <hr className="w-24 border-black mb-3" />
                <p className="text-lg sm:text-2xl font-light text-black text-center mb-8">
                    Let’s Enhance Your Experience
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
                    <input
                        name="firstName"
                        placeholder="First Name"
                        value={form.firstName}
                        onChange={handleChange}
                        className="rounded-full border border-black px-6 py-3 text-black text-base w-full bg-transparent placeholder-black focus:outline-none"
                        required
                    />
                    <input
                        name="lastName"
                        placeholder="Last Name"
                        value={form.lastName}
                        onChange={handleChange}
                        className="rounded-full border border-black px-6 py-3 text-black text-base w-full bg-transparent placeholder-black focus:outline-none"
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        className="rounded-full border border-black px-6 py-3 text-black text-base w-full bg-transparent placeholder-black focus:outline-none sm:col-span-2"
                        required
                    />
                    <input
                        name="phoneNumber"
                        placeholder="Phone Number"
                        value={form.phoneNumber}
                        onChange={handleChange}
                        className="rounded-full border border-black px-6 py-3 text-black text-base w-full bg-transparent placeholder-black focus:outline-none sm:col-span-2"
                    />
                    <input
                        name="universityName"
                        placeholder="University Name"
                        value={form.universityName}
                        onChange={handleChange}
                        className="rounded-full border border-black px-6 py-3 text-black text-base w-full bg-transparent placeholder-black focus:outline-none sm:col-span-2"
                    />
                </div>
                <textarea
                    name="description"
                    placeholder="Write your feedback.."
                    value={form.description}
                    onChange={handleChange}
                    className="rounded-3xl border border-black px-6 py-4 text-base w-full h-32 bg-transparent placeholder-black focus:outline-none mb-4 resize-none"
                    required
                />
                <motion.button
                    type="submit"
                    className="bg-white text-black font-bold rounded-full px-8 py-2 mt-2 shadow-sm transition hover:bg-black hover:text-white"
                    disabled={loading}
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.96 }}
                >
                    {loading ? "Sending..." : "Send Feedback"}
                </motion.button>
                <AnimatePresence>
                    {success && (
                        <motion.div
                            className="text-green-600 mt-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.36 }}
                        >
                            {success}
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            className="text-red-600 mt-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.36 }}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.form>
        </motion.section>
    );
}
