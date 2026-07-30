'use client'
import Accessibility from "@/components/brandStyleGuide/accessibility"
import Badges from "@/components/brandStyleGuide/badges"
import Buttons from "@/components/brandStyleGuide/buttons"
import Card from "@/components/brandStyleGuide/card"
import Colors from "@/components/brandStyleGuide/colors"
import Inputs from "@/components/brandStyleGuide/inputs"
import Loaders from "@/components/brandStyleGuide/loader"
import LogosAndIcons from "@/components/brandStyleGuide/logos-and-icons"
import TabNav from "@/components/brandStyleGuide/tabNav"
import Tokens from "@/components/brandStyleGuide/tokens"
import Changelog from "@/components/brandStyleGuide/change-log"
import Typography from "@/components/brandStyleGuide/typography"
import VoiceAndTone from "@/components/brandStyleGuide/voice"
import { useBrandStyle } from "@/contexts/brandStyleContext/brandStyleContext"
import React from "react"

export default function BrandStyleGuide() {
    const {activeTab} = useBrandStyle()
  return (
        <div className="grid h-screen place-items-center mx-40 ">
            <div >
                <span className="font-mono text-primary">Full SMS</span>
                <h1 className="">Design System</h1>
                <p>Usage guide for styles, tokens and UI Components</p>
                <TabNav/>
                {
                    activeTab==='colors' && (
                        <Colors/>
                    )
                }
                {
                    activeTab==='typography' && (
                        <Typography/>
                    )
                }
                {
                    activeTab==='buttons' && (
                        <Buttons/>
                    )
                }
                {
                    activeTab==='inputs' && (
                        <Inputs/>
                    )
                }
                {
                    activeTab==='badges' && (
                        <Badges/>
                    )
                }
                {
                    activeTab==='card' && (
                        <Card/>
                    )
                }
                {
                    activeTab==='loader' && (
                        <Loaders/>
                    )
                }
                {
                    activeTab==='tokens' && (
                        <Tokens/>
                    )
                }
                                {
                    activeTab==='accessibility' && (
                        <Accessibility/>
                    )
                }
                {
                    activeTab ==='logos and icons' &&(
                        <LogosAndIcons/>
                    )
                }
                {
                    activeTab ==='voice and tone' &&(
                        <VoiceAndTone/>
                    )
                }
                {
                    activeTab ==='change log' &&(
                        <Changelog/>
                    )
                }
            </div>
        </div>
  )
}
