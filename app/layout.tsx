import type {Metadata} from "next";import "./globals.css";
export const metadata:Metadata={title:"Syllingo · Your class. Your practice.",description:"Language practice built around your class. Review vocabulary, practice sentences, and follow your progress with Syllingo.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
