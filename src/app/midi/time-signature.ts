// Corresponds to the Midi time signature event
// 6/8 time with a metronome click every 3 eighth notes and 24 clocks 
// per quarter note would be :
//  nn=06 dd=03 cc=18 bb=08
export class TimeSignature {
    nn: number; // numerator
    dd: number; // denominator.  is a negative power of 2: 2 = quarter note, 3 = eighth, etc
    cc: number; // number of MIDI clocks in a metronome click
    bb: number; // number of notated 32nd notes in a MIDI quarter note (24 MIDI clocks).
}