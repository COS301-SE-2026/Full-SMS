import React from 'react'
import { Card, CardContent } from '../ui'

const paletteItems = [
    {
        "class":"primary",
        "name":"Primary",
        "hex":"#00e5ff"
    },
    {
        "class":"background",
        "name":"Background",
        "hex":"#121212"
    },    
    {
        "class":"card",
        "name":"Card",
        "hex":"#1E1E1E"
    },    
    {
        "class":"foreground",
        "name":"Foreground",
        "hex":"#e8e8e8"
    },    
    {
        "class":"success",
        "name":"Success",
        "hex":"#00e676"
    },    
    {
        "class":"warning",
        "name":"Warning",
        "hex":"#ffd600"
    },    
    {
        "class":"destructive",
        "name":"Destructive",
        "hex":"#ff1744"
    },    
    {
        "class":"border",
        "name":"bg-border",
        "hex":"#3a3a3a"
    },
]

export default function Colors() {
  return (
    <div className='h-full mt-16'>
        <h2>Colors</h2>
        <p>All colors are registered as Tailwind classes and CSS variables. <br/>Use class names in JSX, CSS variables in custom CSS, <br/>and raw values from <span className='text-primary'>lib/tokens.ts </span> in JS/TS</p>
        <p className=' mt-8'>Color palette</p>
        <Card className='mt-4 mb-4'>
            <CardContent  className='grid grid-cols-4 gap-2'>
                {
                    paletteItems.map((item)=>(
                        <Card className='flex flex-col' key={item.name}>
                            <CardContent>
                                <div className={`bg-${(item.class).toLowerCase()} rounded-md h-24 w-full border border-border`}></div>
                                <p>{item.name}</p>
                                <p>{item.hex}</p>
                                <p className={`text-${item.class}`}>bg-{item.class}</p>
                            </CardContent>
                        </Card>
                    ))
                }
            </CardContent>
        </Card>
    </div>
  )
}
