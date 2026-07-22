import React from 'react'
import { Badge, Card, CardContent, CardHeader } from '../ui'

export default function Badges() {
  return (
    <div className="h-screen mt-16 mb-4">
      <h2>Badges</h2>
      <p className='text-foreground/60'>Compact status indicators. Six semantic variants</p>

      <p className='mt-8'>Variants</p>
      <Card>
        <CardHeader className='flex flex-row py-4'>
          <Badge variant={"default"}>Default</Badge>
          <Badge variant={'secondary'}>Secondary</Badge>
          <Badge variant={'outline'}>Outline</Badge>
          <Badge variant={'success'}>Success</Badge>
          <Badge variant={'warning'}>Warning</Badge>
          <Badge variant={'destructive'}>destructive</Badge>
        </CardHeader>
        <CardContent className='bg-background/90 font-mono'>
          <div className='flex flex-col gap-2'>
            <p>
              <span className="text-chart-1">import</span> &#123; Badge &#125;{" "}
              <span className="text-chart-1">from</span>{" "}
              <span className="text-success">'@/components/ui'</span>
            </p>
            <p>&lt;<span className='text-success'>Badge</span> variant =<span className='text'>"default"</span>&gt;&lt;/<span className='text-success'>Badge</span>&gt;</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
