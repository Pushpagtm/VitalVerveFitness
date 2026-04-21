import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Booking = {
  id: number;
  class_name: string;
  appointment_date: string;
  appointment_time: string;
  notes: string;
  created_at: string;
};

type StoredProfile = {
  name: string;
  email: string;
};

const DashboardPage = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("auth_token"), []);
  const storedProfile = useMemo<StoredProfile>(() => {
    const fallback = { name: "Member", email: "member@vitalverve.com" };
    try {
      const raw = localStorage.getItem("auth_user");
      if (!raw) {
        return fallback;
      }
      const parsed = JSON.parse(raw) as Partial<StoredProfile>;
      return {
        name: parsed.name || fallback.name,
        email: parsed.email || fallback.email,
      };
    } catch {
      return fallback;
    }
  }, []);
  const [classes, setClasses] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [className, setClassName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [filterClass, setFilterClass] = useState("All");
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [favoriteClass, setFavoriteClass] = useState("");
  const [preferredTime, setPreferredTime] = useState("Morning");

  useEffect(() => {
    const savedGoal = Number(localStorage.getItem("member_weekly_goal") || "4");
    const savedFavorite = localStorage.getItem("member_favorite_class") || "";
    const savedPreferredTime = localStorage.getItem("member_preferred_time") || "Morning";
    setWeeklyGoal(savedGoal);
    setFavoriteClass(savedFavorite);
    setPreferredTime(savedPreferredTime);
  }, []);

  useEffect(() => {
    localStorage.setItem("member_weekly_goal", String(weeklyGoal));
  }, [weeklyGoal]);

  useEffect(() => {
    localStorage.setItem("member_favorite_class", favoriteClass);
  }, [favoriteClass]);

  useEffect(() => {
    localStorage.setItem("member_preferred_time", preferredTime);
  }, [preferredTime]);

  const readResponseJson = async (response: Response) => {
    const text = await response.text();
    if (!text) {
      return {};
    }
    try {
      return JSON.parse(text);
    } catch {
      return {
        message: `Server returned non-JSON response (${response.status}).`,
      };
    }
  };

  const authHeaders = token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : undefined;

  const loadData = async () => {
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      setLoading(true);
      const [classesResponse, bookingsResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/classes`, { headers: authHeaders }),
        fetch(`${apiBaseUrl}/api/bookings`, { headers: authHeaders }),
      ]);

      const classesData = await readResponseJson(classesResponse);
      const bookingsData = await readResponseJson(bookingsResponse);

      if (!classesResponse.ok || !bookingsResponse.ok) {
        if (classesResponse.status === 401 || bookingsResponse.status === 401) {
          localStorage.removeItem("auth_token");
          navigate("/auth");
          return;
        }
        throw new Error(classesData.message || bookingsData.message || "Could not load dashboard.");
      }

      setClasses(classesData.classes || []);
      setBookings(bookingsData.bookings || []);
      setFilterClass("All");
      if ((classesData.classes || []).length > 0) {
        setClassName(classesData.classes[0]);
        if (!favoriteClass) {
          setFavoriteClass(classesData.classes[0]);
        }
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleBook = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ className, appointmentDate, appointmentTime, notes }),
      });
      const data = await readResponseJson(response);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          navigate("/auth");
          return;
        }
        throw new Error(data.message || "Could not book appointment.");
      }

      setBookings((previous) => [...previous, data.booking]);
      setMessage("Appointment booked successfully.");
      setAppointmentDate("");
      setAppointmentTime("");
      setNotes("");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unexpected error.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    navigate("/auth");
  };

  const handleCancelBooking = async (bookingId: number) => {
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await readResponseJson(response);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          navigate("/auth");
          return;
        }
        throw new Error(data.message || "Could not cancel booking.");
      }

      setBookings((previous) => previous.filter((booking) => booking.id !== bookingId));
      setMessage("Booking cancelled.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unexpected error.");
    }
  };

  const today = new Date();
  const upcomingBookings = bookings.filter(
    (booking) => new Date(booking.appointment_date) >= new Date(today.toDateString())
  );
  const uniqueClassesCount = new Set(bookings.map((booking) => booking.class_name)).size;
  const filteredBookings =
    filterClass === "All"
      ? bookings
      : bookings.filter((booking) => booking.class_name === filterClass);
  const nextBooking = upcomingBookings[0];
  const joinedDate = bookings[0]?.created_at
    ? new Date(bookings[0].created_at).toLocaleDateString()
    : new Date().toLocaleDateString();
  const membershipTier =
    bookings.length >= 15 ? "Elite" : bookings.length >= 7 ? "Pro" : "Starter";
  const renewalDate = new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString();
  const weeklyBookingsCount = upcomingBookings.filter((booking) => {
    const date = new Date(booking.appointment_date);
    const diff = date.getTime() - new Date(today.toDateString()).getTime();
    return diff >= 0 && diff <= 6 * 24 * 60 * 60 * 1000;
  }).length;
  const weeklyProgress = Math.min(100, Math.round((weeklyBookingsCount / weeklyGoal) * 100));
  const scheduleByDate = upcomingBookings.reduce<Record<string, Booking[]>>((accumulator, booking) => {
    const key = booking.appointment_date;
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(booking);
    return accumulator;
  }, {});
  const bookingsByClass = bookings.reduce<Record<string, number>>((accumulator, booking) => {
    accumulator[booking.class_name] = (accumulator[booking.class_name] || 0) + 1;
    return accumulator;
  }, {});
  const sortedClassCounts = Object.entries(bookingsByClass).sort((a, b) => b[1] - a[1]);
  const topClass = sortedClassCounts[0]?.[0];
  const recommendedClasses = classes.filter((entry) => entry !== topClass).slice(0, 3);
  const monthCounts = bookings.reduce<Record<string, number>>((accumulator, booking) => {
    const key = new Date(booking.appointment_date).toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const monthSeries = Object.entries(monthCounts).slice(-6);
  const maxCount = Math.max(...monthSeries.map((item) => item[1]), 1);
  const achievements = [
    { label: "First Booking", done: bookings.length >= 1 },
    { label: "Consistency Champion (5+)", done: bookings.length >= 5 },
    { label: "Class Explorer (3 types)", done: uniqueClassesCount >= 3 },
    { label: "Streak Builder (weekly goal hit)", done: weeklyBookingsCount >= weeklyGoal },
  ];
  const notifications = [
    nextBooking
      ? `Next class: ${nextBooking.class_name} on ${nextBooking.appointment_date} at ${nextBooking.appointment_time}`
      : "Book your next class to stay on track this week.",
    weeklyProgress >= 100
      ? "Great job! Weekly goal completed."
      : `You are ${Math.max(weeklyGoal - weeklyBookingsCount, 0)} booking(s) away from weekly goal.`,
    `Membership renewal due on ${renewalDate}.`,
  ];
  const initials = storedProfile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-20 py-10">
      <div className="mx-auto w-11/12 max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary-500">Member Dashboard</h1>
          <div className="flex items-center gap-5">
            <Link to="/" className="text-sm font-semibold text-primary-500 underline">
              Back to Home
            </Link>
            <button
              type="button"
              className="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </div>
        <div className="mb-6 flex flex-wrap gap-3">
          <a href="#book-section" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white">
            Quick Book
          </a>
          <a href="#schedule-section" className="rounded-md bg-secondary-500 px-4 py-2 text-sm font-semibold text-white">
            Weekly Schedule
          </a>
          <a href="#bookings-section" className="rounded-md bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-500">
            Manage Bookings
          </a>
          <a href="#preferences-section" className="rounded-md bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-500">
            Preferences
          </a>
        </div>
        <div className="mb-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
                {initials}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{storedProfile.name}</p>
                <p className="text-sm text-gray-500">{storedProfile.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Joined</p>
            <p className="font-semibold text-primary-500">{joinedDate}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Membership</p>
            <p className="text-xl font-bold text-primary-500">{membershipTier}</p>
            <p className="mt-2 text-sm text-gray-500">Renewal Date</p>
            <p className="font-semibold text-gray-700">{renewalDate}</p>
            <button className="mt-3 rounded bg-secondary-500 px-3 py-1 text-sm font-semibold text-white">
              Upgrade Plan
            </button>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Weekly Goal Tracker</p>
            <p className="text-sm text-gray-700">
              {weeklyBookingsCount}/{weeklyGoal} bookings this week
            </p>
            <div className="mt-3 h-3 w-full rounded bg-gray-200">
              <div className="h-3 rounded bg-primary-500" style={{ width: `${weeklyProgress}%` }} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-gray-500">Goal</label>
              <input
                type="number"
                min={1}
                max={14}
                value={weeklyGoal}
                onChange={(event) => setWeeklyGoal(Number(event.target.value || 1))}
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Total bookings</p>
            <p className="text-2xl font-bold text-primary-500">{bookings.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Upcoming bookings</p>
            <p className="text-2xl font-bold text-primary-500">{upcomingBookings.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Classes explored</p>
            <p className="text-2xl font-bold text-primary-500">{uniqueClassesCount}</p>
          </div>
        </div>

        {nextBooking && (
          <div className="mb-6 rounded-xl border border-primary-300 bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Next appointment</p>
            <p className="text-lg font-semibold text-primary-500">
              {nextBooking.class_name} on {nextBooking.appointment_date} at {nextBooking.appointment_time}
            </p>
          </div>
        )}

        <div id="schedule-section" className="mb-6 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-primary-500">Weekly Schedule</h2>
          {Object.keys(scheduleByDate).length === 0 ? (
            <p className="text-gray-500">No upcoming classes. Book one to populate your schedule.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(scheduleByDate).map(([date, dayBookings]) => (
                <div key={date} className="rounded-md border border-gray-200 p-3">
                  <p className="font-semibold text-gray-800">{date}</p>
                  <ul className="mt-2 space-y-1">
                    {dayBookings.map((entry) => (
                      <li key={entry.id} className="text-sm text-gray-600">
                        {entry.appointment_time} - {entry.class_name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-primary-500">Achievements</h2>
            <div className="space-y-2">
              {achievements.map((item) => (
                <div
                  key={item.label}
                  className={`rounded px-3 py-2 text-sm ${
                    item.done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.done ? "✓" : "○"} {item.label}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-primary-500">Notifications</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {notifications.map((notice) => (
                <li key={notice} className="rounded bg-primary-100 px-3 py-2">
                  {notice}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-primary-500">Class Recommendations</h2>
            <p className="text-sm text-gray-600">
              {topClass
                ? `You attend "${topClass}" most often. Try these to balance your routine:`
                : "Start by booking your first class and we will personalize recommendations."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {recommendedClasses.map((entry) => (
                <span key={entry} className="rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-500">
                  {entry}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-primary-500">Trainer Spotlight</h2>
            <p className="font-semibold text-gray-800">Coach Mia Thompson</p>
            <p className="text-sm text-gray-600">Strength + Mobility Specialist</p>
            <p className="mt-3 text-sm text-gray-700">
              "Focus on progressive overload this week, and add one recovery-focused yoga session."
            </p>
            <button className="mt-4 rounded bg-secondary-500 px-4 py-2 text-sm font-semibold text-white">
              Contact Trainer
            </button>
          </div>
        </div>

        <div id="preferences-section" className="mb-6 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-primary-500">Saved Preferences</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Favorite Class</label>
              <select
                className="w-full rounded border border-gray-300 px-3 py-2"
                value={favoriteClass}
                onChange={(event) => setFavoriteClass(event.target.value)}
              >
                {classes.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Preferred Time</label>
              <select
                className="w-full rounded border border-gray-300 px-3 py-2"
                value={preferredTime}
                onChange={(event) => setPreferredTime(event.target.value)}
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-primary-500">Monthly Activity Analytics</h2>
          {monthSeries.length === 0 ? (
            <p className="text-gray-500">No analytics yet. Book classes to see trends.</p>
          ) : (
            <div className="flex items-end gap-3 overflow-x-auto">
              {monthSeries.map(([month, count]) => (
                <div key={month} className="min-w-[56px] text-center">
                  <div className="mx-auto flex h-36 w-8 items-end rounded bg-primary-100">
                    <div
                      className="w-full rounded bg-primary-500"
                      style={{ height: `${Math.max(12, Math.round((count / maxCount) * 100))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-600">{month}</p>
                  <p className="text-xs font-semibold text-gray-700">{count}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading dashboard...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div id="book-section" className="rounded-xl bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-primary-500">Book Appointment</h2>
              <form className="space-y-4" onSubmit={handleBook}>
                <select
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={className}
                  onChange={(event) => setClassName(event.target.value)}
                  required
                >
                  {classes.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={appointmentDate}
                  onChange={(event) => setAppointmentDate(event.target.value)}
                  required
                />
                <input
                  type="time"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={appointmentTime}
                  onChange={(event) => setAppointmentTime(event.target.value)}
                  required
                />
                <textarea
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  rows={3}
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
                <button
                  type="submit"
                  className="rounded-md bg-secondary-500 px-5 py-2 font-semibold text-white"
                >
                  Book Now
                </button>
              </form>
              {message && (
                <p className={`mt-4 text-sm ${isError ? "text-red-600" : "text-green-600"}`}>
                  {message}
                </p>
              )}
            </div>

            <div id="bookings-section" className="rounded-xl bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-primary-500">My Bookings</h2>
              <div className="mb-4">
                <label className="mb-1 block text-sm text-gray-600">Filter by class</label>
                <select
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={filterClass}
                  onChange={(event) => setFilterClass(event.target.value)}
                >
                  <option value="All">All Classes</option>
                  {classes.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </div>
              {bookings.length === 0 ? (
                <p className="text-gray-500">No appointments booked yet.</p>
              ) : filteredBookings.length === 0 ? (
                <p className="text-gray-500">No bookings found for this class.</p>
              ) : (
                <ul className="space-y-3">
                  {filteredBookings.map((booking) => (
                    <li key={booking.id} className="rounded-md border border-gray-200 p-3">
                      <p className="font-semibold text-gray-800">{booking.class_name}</p>
                      <p className="text-sm text-gray-600">
                        {booking.appointment_date} at {booking.appointment_time}
                      </p>
                      {booking.notes && <p className="text-sm text-gray-500">{booking.notes}</p>}
                      <button
                        type="button"
                        className="mt-3 rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                        onClick={() => void handleCancelBooking(booking.id)}
                      >
                        Cancel Booking
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
