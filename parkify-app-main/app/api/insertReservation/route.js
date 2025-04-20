import sql from "../../../config/db";

export async function POST(req) {
  try {
    const {
      parkingLotId,
      userId,
      startTime,
      endTime,
      pricePerHour,
      carId,
    } = await req.json();

    // Validation: Check if all required fields are provided
    if (
      !parkingLotId ||
      !userId ||
      !startTime ||
      !endTime ||
      !pricePerHour ||
      !carId
    ) {
      console.error("Validation Error: Missing required fields.");
      return new Response(
        JSON.stringify({ status: "error", message: "All fields are required." }),
        { status: 200 }
      );
    }

    // Log received input for debugging
    console.log("Received startTime:", startTime);
    console.log("Received endTime:", endTime);

    // Parse startTime and endTime as Date objects
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      console.error("Validation Error: Invalid datetime format.");
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Invalid datetime format. Ensure startTime and endTime are correct.",
        }),
        { status: 200 }
      );
    }

    // Calculate total hours and price
    const totalHours = Math.abs((endDateTime - startDateTime) / (1000 * 60 * 60));
    const totalPrice = totalHours * pricePerHour;

    // Get the current timestamp for reservationDate
    const reservationDateTime = new Date();

    console.log("Parsed startDateTime:", startDateTime);
    console.log("Parsed endDateTime:", endDateTime);
    console.log("Total hours:", totalHours);
    console.log("Total price:", totalPrice);

    // Transaction for consistency
    let reservationId = null;
    await sql.begin(async (sql) => {
      // Step 1: Insert reservation
      const reservationResult = await sql`
        INSERT INTO reservation (
          parking_lot_id,
          user_id,
          reservation_date,
          start_time,
          end_time,
          total_price,
          duration_hour,
          duration_day,
          car_id
        )
        VALUES (
          ${parkingLotId},
          ${userId},
          ${reservationDateTime.toISOString()},
          ${startDateTime.toISOString()},
          ${endDateTime.toISOString()},
          ${totalPrice},
          ${Math.ceil(totalHours)},
          ${Math.ceil(totalHours / 24)},
          ${carId}
        )
        RETURNING reservation_id
      `;

      if (reservationResult.length === 0) {
        throw new Error("Reservation could not be created.");
      }

      reservationId = reservationResult[0].reservation_id;

      // Step 2: Update available slots
      const updateResult = await sql`
        UPDATE parking_lot
        SET available_slots = available_slots - 1
        WHERE parking_lot_id = ${parkingLotId} AND available_slots > 0
        RETURNING available_slots
      `;

      if (updateResult.length === 0) {
        throw new Error("Parking lot not found or no available slots.");
      }

      console.log("Updated available_slots:", updateResult[0].available_slots);
    });

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Reservation created successfully.",
        reservationId,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating reservation:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Internal server error.",
        details: error.message,
      }),
      { status: 200 }
    );
  }
}
