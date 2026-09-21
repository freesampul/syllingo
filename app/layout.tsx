import type {Metadata} from "next";import "./globals.css";
export const metadata:Metadata={title:"Hiyaku · Your Japanese notebook",description:"Study your class vocabulary, kanji, and grammar.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
