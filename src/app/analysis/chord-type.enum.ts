export enum ChordType {
    Major,
    Minor,
    Major7,
    Minor7,
    Major9,
    Minor9,
    Dominant7,
    Augmented,
    Diminished,
    HalfDiminished,
    Sus,
    Power,   // Only root and 5th
    Minor7Major, // Not sure if needed, minor chord with major 7th
    NotAchord, // when there are no notes or only one
    Unknown
}