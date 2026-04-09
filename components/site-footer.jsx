import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import Link from "next/link";
import { Github, Instagram, Linkedin, Twitter } from "lucide-react";

export function SiteFooter({ className }) {
  return (
    <footer className={cn("border-t bg-background", className)}>
      <div className="container px-4 py-10 sm:py-12">
        {/* Top Section */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Logo and Description */}
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">
              JUSTLearn is a bespoke Learning Management System tailored for Jashore
              University of Science and Technology, delivering AI-powered education.
            </p>
            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>

          {/* Platform */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold tracking-wide text-foreground">Platform</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/classes" className="text-muted-foreground hover:text-foreground">Browse Classes</Link></li>
              <li><Link href="/instructors" className="text-muted-foreground hover:text-foreground">Instructors</Link></li>
              <li><Link href="/categories" className="text-muted-foreground hover:text-foreground">Categories</Link></li>
              <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold tracking-wide text-foreground">Company</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              <li><Link href="/careers" className="text-muted-foreground hover:text-foreground">Careers</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold tracking-wide text-foreground">Support</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/help" className="text-muted-foreground hover:text-foreground">Help Center</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-10 border-t pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} JUSTLearn. All rights reserved.</p>
            <p>
              Built with <span className="text-foreground">♥</span> by Isa Ahamed San.
              Powered by <span className="font-medium">Next.js</span> and <span className="font-medium">shadcn/ui</span>.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
