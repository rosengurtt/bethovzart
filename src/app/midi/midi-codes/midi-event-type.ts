export enum MidiEventType {
    Note,
    NoteOn,         // type = 8 subtype = 9
    NoteOff,        // type = 8 subtype = 8
    PatchChange,    // type  = 8 subtype = 12
    PressureChange, // type  = 8 subtype = 13
    PitchBend,      // type  = 8 subtype  = 14
    Modulation,     // type  = 8 subtype  = 11 param1  = 1
    VolumeChange,   // type  = 8 subtype  = 11 param1  = 7
    PanChange,      // type  = 8 subtype  = 11 param1  = 10
    ResetAllControllers,    // type  = 8 subtype  = 11 param1  = 121
    Tempo,          // type  = 255 subtype  = 81
    Effect1Depht,   // type  = 8 subtype  = 11 param1  = 91
    Effect2Depht,   // type  = 8 subtype  = 11 param1  = 92
    Effect3Depht,   // type  = 8 subtype  = 11 param1  = 93
    MidiPort,       // type  = 255 subtype  = 33
    KeySignature,   // type  = 255 subtype  = 89
    TimeSignature,  // type  = 255 subtype  = 88
    EndOfTrack,     // type = 255 subtype  = 47
    TrackName       // type = 255 subtype  = 3
}
