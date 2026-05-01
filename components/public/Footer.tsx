"use client";

import React from "react";

const ICP_NUMBER = process.env.NEXT_PUBLIC_ICP_NUMBER || "";

export default function Footer() {
    return (
        <footer className="win95-outset bg-win95-bg mt-8">
            <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-2">
                <div className="text-xs">
                    <span className="animate-blink text-win95-red font-bold">Yuan!</span>{" "}
                </div>
            </div>

            {ICP_NUMBER && (
                <div className="border-t border-win95-gray/30 py-2 text-center">
                    <a
                        href="https://beian.miit.gov.cn/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-win95-gray hover:text-win95-red underline"
                    >
                        {ICP_NUMBER}
                    </a>
                </div>
            )}
        </footer>
    );
}
