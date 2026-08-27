import { Modal } from "../ui/Modal";
import { Button } from '../ui';
import {useState} from 'react'

interface GettingStartedProps{
    readonly open: boolean
    readonly onClose: () => void
}

