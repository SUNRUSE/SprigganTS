# Native engine file format

Game files are fairly straightforward binary files.
All values are encoded in little-endian.
All strings are UTF-8, without a byte-order-mark.

It consists of a series of "chunks", which are themselves binary blobs.
The file begins with an unsigned 32-bit integer specifying the number of chunks.
This is followed by an unsigned 32-bit integer specifying the size of each chunk in order.
The rest of the file consists of the bytes of these chunks, in order.

The first chunk contains metadata; a list of unsigned 16-bit integers, specifying, in order:

- A set of flags.  These are, in order from most significant to least significant bit:
    + Whether the file is from a production build (32768 = production, 0 = development).
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
    + Currently ignored.
- The width of the virtual screen, in virtual pixels.
- The height of the virtual screen, in virtual pixels.
- The number of sprite frames.
- The number of background frames.
- The number of background frame IDs.
- The number of sounds.
- The number of music tracks.
- The number of dialog lines.

The second chunk is the title of the game.

The third chunk is the JavaScript source code to run as a game, compressed using DEFLATE if the file is from a production build.

The fourth chunk is a table of sprite frame data, compressed using DEFLATE if the file is from a production build.
The table is laid out in column-major order, i.e. the first attribute of every sprite frame, then the second attribute of every sprite frame.
Its columns are:

- Unsigned 16-bit integers specifying the number of pixels between the left border of the sprite atlas and the sprite frame.
- Unsigned 16-bit integers specifying the number of pixels between the top border of the sprite atlas and the sprite frame.
- Unsigned 16-bit integers specifying the number of pixels between the left and right borders of the sprite frame.  This is zero if the sprite frame is empty.
- Unsigned 16-bit integers specifying the number of pixels between the top and bottom borders of the sprite frame.  This is zero if the sprite frame is empty.
- Signed 16-bit integers specifying the number of pixels offset the sprite frame to the right; if 2, the left border of the sprite should be 2 pixels right of the origin.
- Signed 16-bit integers specifying the number of pixels offset the sprite frame down; if 2, the top border of the sprite should be 2 pixels down of the origin.
- Unsigned 16-bit integers specifying the number of milliseconds the sprite frame should be displayed for when part of an animation.

The fifth chunk is the PNG of the sprite atlas.

The sixth chunk is a table of background frame data, compressed using DEFLATE if the file is from a production build.
The table is laid out in column-major order, i.e. the first attribute of every background frame, then the second attribute of every background frame.
Its columns are:

- Unsigned 16-bit integers specifying the background frame ID, or 65535 if the background frame is empty; see below for how this is used.
- Unsigned 16-bit integers specifying the number of milliseconds the background frame should be displayed for when part of an animation.

There is then a chunk for every background frame ID, containing the PNG to display.

There is then a chunk containing a table of sound data, compressed using DEFLATE if the file is from a production build.
The table is laid out in column-major order, i.e. the first attribute of every sound, then the second attribute of every sound.
Its columns are:

- 32-bit floats specifying the gain to use when playing back (i.e. 0.4 means reduce volume by 60%).

Then a chunk for every sound.  In production mode, these are Vorbis encoded, but in development mode, stereo interleaved signed 16-bit RAW.

There is then a chunk containing a table of music data, compressed using DEFLATE if the file is from a production build.
The table is laid out in column-major order, i.e. the first attribute of every music track, then the second attribute of every music track.
Its columns are:

- 32-bit floats specifying the gain to use when playing back (i.e. 0.4 means reduce volume by 60%).

Then a chunk for every piece of music.  In production mode, these are Vorbis encoded, but in development mode, stereo interleaved signed 16-bit RAW.

There is then a chunk containing a table of dialog data, compressed using DEFLATE if the file is from a production build.
The table is laid out in column-major order, i.e. the first attribute of every line of dialog, then the second attribute of every line of dialog.
Its columns are:

- 32-bit floats specifying the gain to use when playing back (i.e. 0.4 means reduce volume by 60%).

Then a chunk for every line of dialog.  In production mode, these are Vorbis encoded, but in development mode, stereo interleaved signed 16-bit RAW.