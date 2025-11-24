<?php
// Specific test for the Vanyaland article redirection
// The base64 ID for Vanyaland is: CBMimwFBVV95cUxNM2lvSGhPY2JTbHN2S1pkUFR5d1pHZHhwV19qQXdDVkxXMEZRNUlNX0t2SXlWak1HWjZldmdCVGtWd05tZE05MmZtTXdhcG4xdmNyU0NnYVZoZk9ic2MzdFowelRJcmNxSkdiQ0JocF9lNTRyU0gtTU1Ld0VRY2I1Mk1CdUJPc0lxVzNtSmo1S20zS1NnQ3dBV29Pbw
// It is Protobuf, so standard base64 decoding might produce garbage mixed with the URL.
// We can try to regex valid URLs out of the binary soup.

$base64 = "CBMimwFBVV95cUxNM2lvSGhPY2JTbHN2S1pkUFR5d1pHZHhwV19qQXdDVkxXMEZRNUlNX0t2SXlWak1HWjZldmdCVGtWd05tZE05MmZtTXdhcG4xdmNyU0NnYVZoZk9ic2MzdFowelRJcmNxSkdiQ0JocF9lNTRyU0gtTU1Ld0VRY2I1Mk1CdUJPc0lxVzNtSmo1S20zS1NnQ3dBV29Pbw";
$decoded = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64));

echo "Decoded Raw:\n" . $decoded . "\n\n";

if (preg_match('/(https?:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}[^\s\x00-\x1F]*)/', $decoded, $matches)) {
    echo "Found URL: " . $matches[1] . "\n";
} else {
    echo "No URL found in base64 blob.\n";
}
