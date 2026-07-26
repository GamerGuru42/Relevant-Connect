const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// 1. Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...val] = line.split('=')
    env[key.trim()] = val.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('Seeding Church Info...')
  const { error: churchError } = await supabase
    .from('church_info')
    .upsert({
      id: 'churchInfo',
      church_name: 'Relevant PCF - Christ Embassy',
      pastor_name: 'Pastor Chris Oyakhilome',
      address: 'Christ Embassy Headquarters',
      contact_phone: '+1 (555) 123-4567',
      contact_email: 'hello@relevantpcf.org',
      service_times: 'Sundays at 9:00 AM & Wednesdays at 6:30 PM',
      about_text: 'Welcome to Relevant PCF, a vibrant cell ministry of Christ Embassy where we connect, grow, and impact our world with the Gospel of Jesus Christ. Join us as we shine the light of God’s word!',
      today_scripture: 'But the path of the just is as the shining light, that shineth more and more unto the perfect day. - Proverbs 4:18',
      updated_by: null,
      updated_at: new Date().toISOString()
    })
  
  if (churchError) console.error('Error seeding church info:', churchError)

  console.log('Seeding Announcements...')

  const announcements = [
    {
      title: 'Midweek Communion Service',
      body: 'Join us this Wednesday for a special Midweek Communion Service. Let us break bread together and share in the glorious presence of the Holy Spirit. Do not come alone!',
      category: 'general',
      publish_at: new Date().toISOString(),
      created_by: null
    },
    {
      title: 'Youth Leadership Training',
      body: 'Calling all youth leaders! We have a mandatory leadership training session this Saturday at 10 AM. Come prepared with your writing materials and an expectant heart.',
      category: 'youth',
      publish_at: new Date().toISOString(),
      created_by: null
    },
    {
      title: 'Cell Ministry Outreach',
      body: 'This weekend is our mega cell ministry outreach! We are taking over the streets with the Gospel. Meet at the designated zones at 4 PM.',
      category: 'cell_ministry',
      publish_at: new Date().toISOString(),
      created_by: null
    }
  ]
  
  const { error: annError } = await supabase.from('announcements').insert(announcements)
  if (annError) console.error('Error seeding announcements:', annError)

  console.log('Seeding Events...')
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() + (7 - today.getDay())) // Next Sunday
  
  const wednesday = new Date(today)
  wednesday.setDate(today.getDate() + ((3 - today.getDay() + 7) % 7)) // Next Wednesday

  const events = [
    {
      title: 'Sunday Celebration Service',
      description: 'Experience an atmosphere of worship, miracles, and the undiluted Word of God at our Sunday Celebration Service.',
      category: 'service',
      date: sunday.toISOString().split('T')[0],
      time: '09:00',
      venue_name: 'Main Auditorium',
      venue_address: 'Christ Embassy Main Campus',
      publish_at: new Date().toISOString(),
      created_by: null
    },
    {
      title: 'Midweek Service',
      description: 'Recharge your spirit mid-week with deep insights into the Word.',
      category: 'midweek',
      date: wednesday.toISOString().split('T')[0],
      time: '18:30',
      venue_name: 'Main Auditorium',
      venue_address: 'Christ Embassy Main Campus',
      publish_at: new Date().toISOString(),
      created_by: null
    },
    {
      title: 'Relevant PCF Zonal Meeting',
      description: 'A special gathering of all Relevant PCF members across the zone for a time of fellowship and impartation.',
      category: 'cell_meeting',
      date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
      time: '16:00',
      venue_name: 'PCF Hall A',
      venue_address: 'Christ Embassy Campus 2',
      publish_at: new Date().toISOString(),
      created_by: null
    }
  ]

  const { error: evtError } = await supabase.from('events').insert(events)
  if (evtError) console.error('Error seeding events:', evtError)

  console.log('Database seeded successfully!')
}

seed()
