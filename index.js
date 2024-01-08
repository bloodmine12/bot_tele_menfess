const { Telegraf } = require("telegraf");
require("dotenv").config();

const token = process.env.BOT_TOKEN;
const ownerId = "1279152375";

const members = [];

const bot = new Telegraf(token);

const initializeDatabase = async () => {
  try {
    console.log("Program Berjalan");
  } catch (error) {
    console.error("Error initializing array:", error);
  }
};

const updateMemberData = (userId, data) => {
  const existingMemberIndex = members.findIndex(
    (member) => member.id === userId
  );

  if (existingMemberIndex !== -1) {
    // If member exists, update the data
    members[existingMemberIndex] = { id: userId, ...data };
  } else {
    // If member does not exist, add a new member
    members.push({ id: userId, ...data });
  }
};

const getMemberData = (userId) => {
  const member = members.find((m) => m.id === userId);
  return member || null;
};

// Initialize array on startup
initializeDatabase();

// /start command
bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    console.log("User ID:", userId);

    const member = await getMemberData(userId);
    console.log("Member Data:", member);

    if (!member) {
      console.log("Member telah berhasil terdaftar");

      // If member not found, insert default data
      updateMemberData(userId, {
        name: "Default Name",
        koin: 0,
        status: "silver",
        dailyQuota: 10,
      });
    }

    // Rest of your start logic
    const menuText = `
  Selamat Datang di Bot XYZ! 🤖
  
  ℹ️ Berikut adalah beberapa perintah yang bisa Anda gunakan:
  
  🔍 /status - Cek Status Akun dan Saldo Koin Anda
  💰 /topup - Isi Ulang Koin
  📢 Untuk format pengiriman promosi ke channel kami:
     "Cari Fwb #girls"
     Gunakan #boys atau #girls pada pesannya.
  
  👁️‍🗨️ Untuk melihat pesan di channel, cek link channel dan grup di bagian atas.
  
  Selamat menggunakan! Jika ada pertanyaan, ketik /help.
      `;
    ctx.reply(menuText);
  } catch (error) {
    console.error("Error in /start command:", error);
  }
});

// /status command
bot.command("status", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const member = getMemberData(userId);

    if (member) {
      const statusMessage = `
ID: ${member.id}
Koin: ${member.koin}
Status: ${member.status}
Kuota Harian: ${member.dailyQuota}
      `;
      ctx.reply(statusMessage);
    } else {
      ctx.reply(
        "Data member tidak ditemukan. Mohon gunakan perintah /start terlebih dahulu."
      );
    }
  } catch (error) {
    console.error("Masalah pada /status : ", error);
  }
});

// /topup command
bot.command("topup", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const isOwner = userId.toString() === ownerId; // Convert userId to string for comparison

    if (isOwner) {
      // Owner-specific topup logic
      const args = ctx.message.text.split(" ");
      const targetUserId = parseInt(args[1]);
      const topupAmount = parseInt(args[2]);

      if (isNaN(targetUserId) || isNaN(topupAmount)) {
        ctx.reply(
          "Format perintah tidak valid. Gunakan /topup [userId] [jumlah]"
        );
      } else {
        const targetMember = getMemberData(targetUserId);
        if (!targetMember) {
          ctx.reply("Member tidak ditemukan");
          return;
        }

        targetMember.koin += topupAmount;
        updateMemberData(targetUserId, targetMember);

        // Pesan konfirmasi untuk owner
        const ownerConfirmationMessage = `
  🎉 Top-up sukses! Anda berhasil menambahkan ${topupAmount} koin ke akun ${targetMember.name} (ID: ${targetUserId}).
          `;
        ctx.reply(ownerConfirmationMessage);

        // Pesan konfirmasi untuk pengguna yang menerima koin
        const userConfirmationMessage = `
  🎉 Selamat! Koin sebesar ${topupAmount} telah berhasil ditambahkan ke akun anda.
  
  Terima kasih atas kontribusi anda! 🙌✨
          `;
        bot.telegram.sendMessage(targetUserId, userConfirmationMessage);
      }
    } else {
      // Non-owner message
      ctx.reply(
        "Silahkan Hubungi Owner Ilham Ahmad : @ilham_ar1, Hati-hati penipuan owner tidak pernah mengajak top up secara langsung atau via apapun"
      );
    }
  } catch (error) {
    console.error("Masalah pada /topup : ", error);
  }
});

// /help command (optional)
bot.command("help", (ctx) => {
  const helpText = `
Command List:
/start - Menampilkan pesan selamat datang dan menu
/status - Cek Status Akun dan Saldo Koin Anda
/topup - Isi Ulang Coin
/help - Menampilkan pesan bantuan
  `;
  ctx.reply(helpText);
});

// Function to send a message to the channel
const sendMessageToChannel = async (message) => {
  try {
    await bot.telegram.sendMessage(channelId, message);
  } catch (error) {
    console.error("Proses mengirim pesan bermasalah : ", error);
  }
};

// Listen for any text message from the user
bot.on("text", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const isOwner = userId.toString() === ownerId; // Convert userId to string for comparison

    if (!isOwner) {
      // Non-owner-specific logic
      const member = getMemberData(userId);

      if (member) {
        // Check dailyQuota
        if (member.dailyQuota > 0) {
          // Owner-specific logic to send a message to the channel
          const messageText = ctx.message.text;

          if (messageText.trim() !== "") {
            // If the message is not empty, send it to the channel
            await sendMessageToChannel(messageText);

            // Reduce dailyQuota
            member.dailyQuota -= 1;
            updateMemberData(userId, member);

            ctx.reply("Pesan berhasil terkirim menggunakan kuota harian anda");
          } else {
            ctx.reply("Pesan gagal terkirim");
          }
        } else if (member.koin >= 10) {
          // Check if user has at least 10 coins
          // Owner-specific logic to send a message to the channel
          const messageText = ctx.message.text;

          if (messageText.trim() !== "") {
            // If the message is not empty, send it to the channel
            await sendMessageToChannel(messageText);

            // Reduce 10 coins
            member.koin -= 10;
            updateMemberData(userId, member);

            ctx.reply("Pesan berhasil terkirim menggunakan 10 koin");
          } else {
            ctx.reply("Pesan gagal terkirim");
          }
        } else {
          ctx.reply(
            "Kuota harian anda telah habis, dan saldo koin anda tidak mencukupi untuk mengirim pesan. Anda bisa mengirim pesan kembali besok atau isi ulang koin."
          );
        }
      } else {
        ctx.reply(
          "Anda belum terdaftar pada bot. Silahkan klik /start untuk mendaftarkan diri"
        );
      }
    }
  } catch (error) {
    console.error("Proses mengirim pesan bermasalah : ", error);
  }
});

// Launch the bot
bot.launch();
