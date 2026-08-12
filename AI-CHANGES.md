// =====================================================================
// FILE: package.json
// PURPOSE: Change the production start script to serve on port 80
//          instead of 3000, so the LAN URL needs no port number.
// AI ASSISTANCE: Change suggested and applied via Claude (Anthropic)
//                chat session, 2026-08-12.
// =====================================================================
//
// Why this is needed:
//   Port 80 is the web's default HTTP port, so browsers connect to it
//   automatically with no port number typed. Staying on 3000 means
//   every device has to type "funkybooking:3000" instead of just
//   "funkybooking".
//
// What happens if this is removed (reverted to -p 80 back to 3000):
//   The app keeps working fine on its own — but the short-URL setup
//   silently breaks. Anyone typing "http://funkybooking" alone gets
//   a connection failure, since nothing is listening on port 80
//   anymore. Port 3000 would need adding back to every reference.
// =====================================================================