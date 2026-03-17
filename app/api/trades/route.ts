import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET — obtener todos los trades
export async function GET() {
    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('trade_date', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// POST — crear nuevo trade
export async function POST(req: NextRequest) {
    const body = await req.json()
    const { data, error } = await supabase
        .from('trades')
        .insert([body])
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}

// PUT — editar trade existente
export async function PUT(req: NextRequest) {
    const body = await req.json()
    const { id, ...fields } = body

    const { data, error } = await supabase
        .from('trades')
        .update(fields)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// DELETE — eliminar trade
export async function DELETE(req: NextRequest) {
    const { id } = await req.json()

    const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}