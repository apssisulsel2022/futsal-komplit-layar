import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SeedUser {
  email: string;
  password: string;
  full_name: string;
  role: "admin_provinsi" | "admin_kab_kota" | "panitia" | "wasit" | "evaluator";
  kabupaten_kota_id?: string;
  birth_date?: string;
  license_level?: string;
  license_expiry?: string;
  afk_origin?: string;
  occupation?: string;
  is_active?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("Starting database seeding...");

    // Get kabupaten_kota data
    const { data: kabKota } = await supabaseAdmin
      .from("kabupaten_kota")
      .select("id, name")
      .order("name");

    if (!kabKota || kabKota.length === 0) {
      return new Response(
        JSON.stringify({ error: "No kabupaten_kota data found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const kabKotaMap = new Map(kabKota.map(k => [k.name, k.id]));
    const makassarId = kabKotaMap.get("Kota Makassar") || kabKota[0].id;
    const gowaId = kabKotaMap.get("Kabupaten Gowa") || kabKota[1]?.id || kabKota[0].id;
    const marosId = kabKotaMap.get("Kabupaten Maros") || kabKota[2]?.id || kabKota[0].id;
    const takalarId = kabKotaMap.get("Kabupaten Takalar") || kabKota[3]?.id || kabKota[0].id;
    const boneId = kabKotaMap.get("Kabupaten Bone") || kabKota[4]?.id || kabKota[0].id;

    // Define seed users
    const seedUsers: SeedUser[] = [
      // Admin Provinsi
      {
        email: "admin.provinsi@ffss.id",
        password: "Admin123!",
        full_name: "Admin Provinsi Sulsel",
        role: "admin_provinsi",
        kabupaten_kota_id: makassarId,
        occupation: "Administrator",
      },
      // Admin Kab/Kota
      {
        email: "admin.makassar@ffss.id",
        password: "Admin123!",
        full_name: "Admin Kota Makassar",
        role: "admin_kab_kota",
        kabupaten_kota_id: makassarId,
        occupation: "Administrator",
      },
      {
        email: "admin.gowa@ffss.id",
        password: "Admin123!",
        full_name: "Admin Kabupaten Gowa",
        role: "admin_kab_kota",
        kabupaten_kota_id: gowaId,
        occupation: "Administrator",
      },
      // Panitia
      {
        email: "panitia.makassar@ffss.id",
        password: "Panitia123!",
        full_name: "Panitia Makassar 1",
        role: "panitia",
        kabupaten_kota_id: makassarId,
        occupation: "Event Organizer",
      },
      {
        email: "panitia.gowa@ffss.id",
        password: "Panitia123!",
        full_name: "Panitia Gowa 1",
        role: "panitia",
        kabupaten_kota_id: gowaId,
        occupation: "Event Organizer",
      },
      // Wasit
      {
        email: "ahmad.rizky@ffss.id",
        password: "Wasit123!",
        full_name: "Ahmad Rizky Pratama",
        role: "wasit",
        kabupaten_kota_id: makassarId,
        birth_date: "1990-05-15",
        license_level: "Lisensi A",
        license_expiry: "2026-12-31",
        afk_origin: "AFK Makassar",
        occupation: "Guru Olahraga",
        is_active: true,
      },
      {
        email: "budi.santoso@ffss.id",
        password: "Wasit123!",
        full_name: "Budi Santoso",
        role: "wasit",
        kabupaten_kota_id: gowaId,
        birth_date: "1988-08-20",
        license_level: "Lisensi A",
        license_expiry: "2026-06-30",
        afk_origin: "AFK Gowa",
        occupation: "Pelatih Futsal",
        is_active: true,
      },
      {
        email: "cahya.putra@ffss.id",
        password: "Wasit123!",
        full_name: "Cahya Putra Wijaya",
        role: "wasit",
        kabupaten_kota_id: marosId,
        birth_date: "1992-03-10",
        license_level: "Lisensi B",
        license_expiry: "2025-08-15",
        afk_origin: "AFK Maros",
        occupation: "Wiraswasta",
        is_active: true,
      },
      {
        email: "dedi.kurniawan@ffss.id",
        password: "Wasit123!",
        full_name: "Dedi Kurniawan",
        role: "wasit",
        kabupaten_kota_id: makassarId,
        birth_date: "1995-11-25",
        license_level: "Lisensi B",
        license_expiry: "2025-10-20",
        afk_origin: "AFK Makassar",
        occupation: "Karyawan Swasta",
        is_active: false, // Inactive wasit
      },
      {
        email: "eko.prasetyo@ffss.id",
        password: "Wasit123!",
        full_name: "Eko Prasetyo",
        role: "wasit",
        kabupaten_kota_id: takalarId,
        birth_date: "1993-07-08",
        license_level: "Lisensi C",
        license_expiry: "2025-04-30",
        afk_origin: "AFK Takalar",
        occupation: "Mahasiswa",
        is_active: true,
      },
      {
        email: "fajar.ramadhan@ffss.id",
        password: "Wasit123!",
        full_name: "Fajar Ramadhan",
        role: "wasit",
        kabupaten_kota_id: gowaId,
        birth_date: "1997-01-12",
        license_level: "Lisensi C",
        license_expiry: "2025-09-15",
        afk_origin: "AFK Gowa",
        occupation: "Freelancer",
        is_active: true,
      },
      {
        email: "gunawan.setiawan@ffss.id",
        password: "Wasit123!",
        full_name: "Gunawan Setiawan",
        role: "wasit",
        kabupaten_kota_id: boneId,
        birth_date: "1991-09-30",
        license_level: "Lisensi A",
        license_expiry: "2026-03-20",
        afk_origin: "AFK Bone",
        occupation: "PNS",
        is_active: true,
      },
      {
        email: "hendra.saputra@ffss.id",
        password: "Wasit123!",
        full_name: "Hendra Saputra",
        role: "wasit",
        kabupaten_kota_id: makassarId,
        birth_date: "1994-12-05",
        license_level: "Lisensi B",
        license_expiry: "2025-11-10",
        afk_origin: "AFK Makassar",
        occupation: "Guru",
        is_active: true,
      },
    ];

    const createdUsers: { email: string; id: string; role: string }[] = [];
    const errors: { email: string; error: string }[] = [];

    for (const user of seedUsers) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUser?.users?.some(u => u.email === user.email);
        
        if (userExists) {
          console.log(`User ${user.email} already exists, skipping...`);
          continue;
        }

        // Create auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name },
        });

        if (createError) {
          errors.push({ email: user.email, error: createError.message });
          continue;
        }

        // Update profile
        const profileUpdate: Record<string, unknown> = {
          kabupaten_kota_id: user.kabupaten_kota_id,
          is_profile_complete: true,
          is_active: user.is_active ?? true,
        };

        if (user.birth_date) profileUpdate.birth_date = user.birth_date;
        if (user.license_level) profileUpdate.license_level = user.license_level;
        if (user.license_expiry) profileUpdate.license_expiry = user.license_expiry;
        if (user.afk_origin) profileUpdate.afk_origin = user.afk_origin;
        if (user.occupation) profileUpdate.occupation = user.occupation;

        await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("id", newUser.user.id);

        // Assign role
        await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: newUser.user.id, role: user.role });

        createdUsers.push({ email: user.email, id: newUser.user.id, role: user.role });
        console.log(`Created user: ${user.email} with role ${user.role}`);
      } catch (err) {
        errors.push({ email: user.email, error: String(err) });
      }
    }

    // Get wasit user IDs for events and assignments
    const { data: wasitUsers } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "wasit");

    const wasitIds = wasitUsers?.map(w => w.user_id) || [];

    // Get panitia user IDs
    const { data: panitiaUsers } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "panitia");

    const panitiaId = panitiaUsers?.[0]?.user_id;

    // Get admin provinsi ID
    const { data: adminUsers } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin_provinsi");

    const adminId = adminUsers?.[0]?.user_id;

    // Create events
    if (panitiaId && wasitIds.length > 0) {
      const events = [
        {
          name: "Piala Walikota Futsal 2025",
          date: "2025-01-15",
          location: "GOR Sudiang, Makassar",
          category: "Profesional",
          description: "Turnamen futsal tahunan tingkat kota",
          status: "SELESAI",
          kabupaten_kota_id: makassarId,
          created_by: panitiaId,
        },
        {
          name: "Liga Futsal Pelajar Gowa",
          date: "2025-02-20",
          location: "GOR Sungguminasa, Gowa",
          category: "Pelajar",
          description: "Kompetisi futsal antar sekolah",
          status: "DISETUJUI",
          kabupaten_kota_id: gowaId,
          created_by: panitiaId,
        },
        {
          name: "Turnamen Futsal Ramadhan",
          date: "2025-03-10",
          location: "Lapangan Karebosi, Makassar",
          category: "Umum",
          description: "Turnamen futsal menyambut Ramadhan",
          status: "DIAJUKAN",
          kabupaten_kota_id: makassarId,
          created_by: panitiaId,
        },
        {
          name: "Kejuaraan Futsal Antar Kecamatan",
          date: "2025-04-05",
          location: "GOR Mattoangin, Makassar",
          category: "Umum",
          description: "Kompetisi futsal antar kecamatan se-Makassar",
          status: "DIAJUKAN",
          kabupaten_kota_id: makassarId,
          created_by: panitiaId,
        },
        {
          name: "Festival Futsal Sulsel 2025",
          date: "2025-05-15",
          location: "GOR Sudiang, Makassar",
          category: "Profesional",
          description: "Festival futsal terbesar di Sulawesi Selatan",
          status: "DITOLAK",
          kabupaten_kota_id: makassarId,
          created_by: panitiaId,
        },
      ];

      const { data: createdEvents, error: eventError } = await supabaseAdmin
        .from("events")
        .insert(events)
        .select();

      if (eventError) {
        console.error("Error creating events:", eventError);
      } else {
        console.log(`Created ${createdEvents?.length} events`);

        // Create event approvals
        if (createdEvents && adminId) {
          const approvals = createdEvents.map(event => ({
            event_id: event.id,
            action: event.status === "DIAJUKAN" ? "SUBMIT" : 
                   event.status === "DISETUJUI" || event.status === "SELESAI" ? "APPROVE" : "REJECT",
            from_status: null,
            to_status: event.status === "SELESAI" ? "DISETUJUI" : event.status,
            approved_by: event.status === "DIAJUKAN" ? panitiaId : adminId,
            notes: event.status === "DIAJUKAN" ? "Event diajukan" :
                   event.status === "DITOLAK" ? "Jadwal bentrok dengan event lain" : "Event disetujui",
          }));

          await supabaseAdmin.from("event_approvals").insert(approvals);

          // Add completion record for SELESAI events
          const selesaiEvents = createdEvents.filter(e => e.status === "SELESAI");
          for (const event of selesaiEvents) {
            await supabaseAdmin.from("event_approvals").insert({
              event_id: event.id,
              action: "COMPLETE",
              from_status: "DISETUJUI",
              to_status: "SELESAI",
              approved_by: adminId,
              notes: "Event selesai",
            });
          }

          // Create event assignments for approved/completed events
          const assignableEvents = createdEvents.filter(e => 
            e.status === "DISETUJUI" || e.status === "SELESAI"
          );

          for (const event of assignableEvents) {
            // Assign 2-3 wasit per event
            const assignCount = Math.min(3, wasitIds.length);
            for (let i = 0; i < assignCount; i++) {
              await supabaseAdmin.from("event_assignments").insert({
                event_id: event.id,
                referee_id: wasitIds[i],
                role: i === 0 ? "UTAMA" : "CADANGAN",
                status: "confirmed",
              });
            }
          }

          // Create honors for completed events
          const completedEvents = createdEvents.filter(e => e.status === "SELESAI");
          for (const event of completedEvents) {
            // Get assignments for this event
            const { data: assignments } = await supabaseAdmin
              .from("event_assignments")
              .select("referee_id, role")
              .eq("event_id", event.id);

            for (const assignment of assignments || []) {
              const amount = assignment.role === "UTAMA" ? 500000 : 350000;
              await supabaseAdmin.from("honors").insert({
                referee_id: assignment.referee_id,
                event_id: event.id,
                amount,
                status: "verified",
                verified_by: adminId,
                verified_at: new Date().toISOString(),
                notes: "Honor untuk event " + event.name,
              });
            }
          }
        }
      }
    }

    // Create referee reviews
    if (wasitIds.length > 0) {
      const reviewers = ["Bapak Andi", "Ibu Siti", "Pak Ahmad", "Bu Fatimah", "Mas Joko"];
      const comments = [
        "Wasit sangat profesional dan adil",
        "Keputusan wasit sangat baik",
        "Performa wasit memuaskan",
        "Wasit perlu lebih tegas",
        "Wasit sangat membantu kelancaran pertandingan",
      ];

      const reviews = [];
      for (let i = 0; i < Math.min(5, wasitIds.length); i++) {
        const reviewCount = Math.floor(Math.random() * 3) + 2; // 2-4 reviews per wasit
        for (let j = 0; j < reviewCount; j++) {
          reviews.push({
            referee_id: wasitIds[i],
            rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
            reviewer_name: reviewers[Math.floor(Math.random() * reviewers.length)],
            comment: comments[Math.floor(Math.random() * comments.length)],
          });
        }
      }

      await supabaseAdmin.from("referee_reviews").insert(reviews);
      console.log(`Created ${reviews.length} referee reviews`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Database seeded successfully",
        created_users: createdUsers,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
