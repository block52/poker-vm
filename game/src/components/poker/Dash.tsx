/**
 * v0 by Vercel.
 * @see https://v0.dev/t/1nRC7PE7l4p
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Button } from "@/components/ui/button";

export default function Component() {
    return (
        <div className="flex flex-col items-center h-screen bg-[url('/felt-texture.jpg')] bg-cover bg-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-4xl">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <div className="bg-[#2c3e50] rounded-2xl p-6 text-white">
                            <div className="grid grid-cols-5 gap-4">
                                <div className="col-span-3 flex items-center justify-center">
                                    <div className="bg-[#34495e] rounded-xl p-4 w-full">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white rounded-xl p-2 flex items-center justify-center">
                                                <div className="bg-[#c0392b] rounded-xl p-2 w-full h-full flex items-center justify-center">
                                                    <span className="text-2xl font-bold">
                                                        2
                                                    </span>
                                                    <span className="text-xl font-bold">
                                                        ♥
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-xl p-2 flex items-center justify-center">
                                                <div className="bg-[#27ae60] rounded-xl p-2 w-full h-full flex items-center justify-center">
                                                    <span className="text-2xl font-bold">
                                                        7
                                                    </span>
                                                    <span className="text-xl font-bold">
                                                        ♠
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 flex flex-col items-center justify-center gap-4">
                                    <div className="bg-[#34495e] rounded-xl p-4 w-full">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white rounded-xl p-2 flex items-center justify-center">
                                                <div className="bg-[#f39c12] rounded-xl p-2 w-full h-full flex items-center justify-center">
                                                    <span className="text-2xl font-bold">
                                                        K
                                                    </span>
                                                    <span className="text-xl font-bold">
                                                        ♦
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-xl p-2 flex items-center justify-center">
                                                <div className="bg-[#8e44ad] rounded-xl p-2 w-full h-full flex items-center justify-center">
                                                    <span className="text-2xl font-bold">
                                                        A
                                                    </span>
                                                    <span className="text-xl font-bold">
                                                        ♣
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[#34495e] rounded-xl p-4 w-full">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white rounded-xl p-2 flex items-center justify-center">
                                                <div className="bg-[#e74c3c] rounded-xl p-2 w-full h-full flex items-center justify-center">
                                                    <span className="text-2xl font-bold">
                                                        Q
                                                    </span>
                                                    <span className="text-xl font-bold">
                                                        ♥
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-xl p-2 flex items-center justify-center">
                                                <div className="bg-[#2980b9] rounded-xl p-2 w-full h-full flex items-center justify-center">
                                                    <span className="text-2xl font-bold">
                                                        J
                                                    </span>
                                                    <span className="text-xl font-bold">
                                                        ♠
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="bg-[#34495e] rounded-2xl p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div className="font-bold">Pot</div>
                                <div className="text-2xl font-bold">$1,250</div>
                            </div>
                        </div>
                        <div className="bg-[#34495e] rounded-2xl p-4 text-white">
                            <div className="grid grid-cols-3 gap-4">
                                <Button>Bet</Button>
                                <Button variant="secondary">Check</Button>
                                <Button variant="destructive">Fold</Button>
                            </div>
                        </div>
                        <div className="bg-[#34495e] rounded-2xl p-4 text-white">
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="destructive">Raise</Button>
                                <Button variant="secondary">Call</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
