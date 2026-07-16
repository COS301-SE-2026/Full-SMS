import {Modal} from '../ui/Modal'
import { Button } from '../ui';
import {useState} from 'react'
import { useEffect } from 'react';
import { getSessions } from '@/lib/api/sessions';
import { supabase } from '@/lib/supabase/supabaseConfig';

interface RecentSessionsProps{
    open: boolean
    onClose: () => void
}
