"use server";

import { auth } from "@clerk/nextjs";
import { PrismaClient } from "@prisma/client";
import { put, del } from '@vercel/blob';
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// ============= DEBT MANAGEMENT ACTIONS =============

// Create a new debt
export async function createDebt(data) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    const debt = await prisma.debt.create({
      data: {
        ...data,
        userId,
        remainingAmount: data.totalAmount,
      },
      include: {
        payments: true,
        receipts: true,
      },
    });

    revalidatePath("/debt-tracker");
    return { success: true, data: debt };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get all debts for a user
export async function getDebts() {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    const debts = await prisma.debt.findMany({
      where: { userId },
      include: {
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 5,
        },
        receipts: {
          orderBy: { uploadDate: "desc" },
        },
        _count: {
          select: {
            payments: true,
            receipts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: debts };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get debt by ID
export async function getDebtById(debtId) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    const debt = await prisma.debt.findFirst({
      where: { id: debtId, userId },
      include: {
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        receipts: {
          orderBy: { uploadDate: "desc" },
        },
      },
    });

    if (!debt) throw new Error("Debt not found");

    return { success: true, data: debt };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update debt
export async function updateDebt(debtId, data) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    const debt = await prisma.debt.update({
      where: { id: debtId, userId },
      data,
      include: {
        payments: true,
        receipts: true,
      },
    });

    revalidatePath("/debt-tracker");
    return { success: true, data: debt };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Delete debt
export async function deleteDebt(debtId) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    await prisma.debt.delete({
      where: { id: debtId, userId },
    });

    revalidatePath("/debt-tracker");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Add debt payment
export async function addDebtPayment(debtId, paymentData) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    const debt = await prisma.debt.findFirst({
      where: { id: debtId, userId },
    });

    if (!debt) throw new Error("Debt not found");

    const payment = await prisma.debtPayment.create({
      data: {
        ...paymentData,
        debtId,
      },
    });

    // Update remaining amount
    const newRemainingAmount = Math.max(0, debt.remainingAmount - paymentData.amount);
    const newStatus = newRemainingAmount === 0 ? "PAID_OFF" : debt.status;

    await prisma.debt.update({
      where: { id: debtId },
      data: {
        remainingAmount: newRemainingAmount,
        status: newStatus,
      },
    });

    revalidatePath("/debt-tracker");
    return { success: true, data: payment };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get debt payments
export async function getDebtPayments(debtId) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    const payments = await prisma.debtPayment.findMany({
      where: {
        debt: {
          id: debtId,
          userId,
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return { success: true, data: payments };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get debt analytics
export async function getDebtAnalytics() {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    const [
      totalDebts,
      activeDebts,
      paidOffDebts,
      totalDebtAmount,
      totalRemainingAmount,
      monthlyEMI,
      upcomingPayments,
    ] = await Promise.all([
      prisma.debt.count({ where: { userId } }),
      prisma.debt.count({ where: { userId, status: "ACTIVE" } }),
      prisma.debt.count({ where: { userId, status: "PAID_OFF" } }),
      prisma.debt.aggregate({
        where: { userId },
        _sum: { totalAmount: true },
      }),
      prisma.debt.aggregate({
        where: { userId, status: "ACTIVE" },
        _sum: { remainingAmount: true },
      }),
      prisma.debt.aggregate({
        where: { userId, status: "ACTIVE", emiAmount: { not: null } },
        _sum: { emiAmount: true },
      }),
      prisma.debt.findMany({
        where: {
          userId,
          status: "ACTIVE",
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ]);

    const analytics = {
      totalDebts,
      activeDebts,
      paidOffDebts,
      totalDebtAmount: totalDebtAmount._sum.totalAmount || 0,
      totalRemainingAmount: totalRemainingAmount._sum.remainingAmount || 0,
      monthlyEMI: monthlyEMI._sum.emiAmount || 0,
      upcomingPayments,
      debtToIncomeRatio: 0, // Calculate based on income data if available
      averageInterestRate: 0, // Calculate average
    };

    return { success: true, data: analytics };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Export debt data
export async function exportDebtData(format = "csv") {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    const debts = await prisma.debt.findMany({
      where: { userId },
      include: {
        payments: true,
        receipts: true,
      },
    });

    // Format data for export
    const exportData = debts.map(debt => ({
      name: debt.name,
      type: debt.type,
      totalAmount: debt.totalAmount,
      remainingAmount: debt.remainingAmount,
      interestRate: debt.interestRate,
      emiAmount: debt.emiAmount,
      dueDate: debt.dueDate,
      status: debt.status,
      priority: debt.priority,
      lenderName: debt.lenderName,
      paymentsCount: debt.payments.length,
      totalPaid: debt.payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      receiptsCount: debt.receipts.length,
      createdAt: debt.createdAt,
    }));

    return { success: true, data: exportData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get debt reminders
export async function getDebtReminders() {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    const reminders = await prisma.debt.findMany({
      where: {
        userId,
        status: "ACTIVE",
        reminderEnabled: true,
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return { success: true, data: reminders };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============= FILE UPLOAD ACTIONS =============

// Upload file to storage
export async function uploadFile(formData) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    const file = formData.get('file');
    if (!file) throw new Error("No file provided");

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error("File type not allowed. Only JPG, PNG, and PDF files are supported.");
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;

    // Upload to blob storage
    const blob = await put(fileName, file, {
      access: 'public',
    });

    return {
      success: true,
      data: {
        url: blob.url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Save receipt to database
export async function saveReceiptToDatabase(debtId, receiptData) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    // Verify debt belongs to user
    const debt = await prisma.debt.findFirst({
      where: { id: debtId, userId }
    });

    if (!debt) throw new Error("Debt not found");

    // Save receipt
    const receipt = await prisma.debtReceipt.create({
      data: {
        fileName: receiptData.fileName,
        fileUrl: receiptData.url,
        fileSize: receiptData.fileSize,
        mimeType: receiptData.mimeType,
        description: receiptData.description || null,
        debtId: debtId,
      }
    });

    revalidatePath("/debt-tracker");
    return { success: true, data: receipt };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get all receipts for a debt
export async function getDebtReceipts(debtId) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    const receipts = await prisma.debtReceipt.findMany({
      where: {
        debt: {
          id: debtId,
          userId
        }
      },
      orderBy: { uploadDate: 'desc' }
    });

    return { success: true, data: receipts };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Delete receipt
export async function deleteReceipt(receiptId) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    // Get receipt with debt info to verify ownership
    const receipt = await prisma.debtReceipt.findFirst({
      where: {
        id: receiptId,
        debt: {
          userId
        }
      }
    });

    if (!receipt) throw new Error("Receipt not found");

    // Delete from blob storage
    try {
      await del(receipt.fileUrl);
    } catch (blobError) {
      console.error("Failed to delete from blob storage:", blobError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await prisma.debtReceipt.delete({
      where: { id: receiptId }
    });

    revalidatePath("/debt-tracker");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Bulk upload receipts
export async function bulkUploadReceipts(debtId, filesFormData) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    // Verify debt belongs to user
    const debt = await prisma.debt.findFirst({
      where: { id: debtId, userId }
    });

    if (!debt) throw new Error("Debt not found");

    const uploadedReceipts = [];
    const errors = [];

    // Process each file
    for (const [key, file] of filesFormData.entries()) {
      if (file instanceof File) {
        try {
          // Upload individual file
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          
          const uploadResult = await uploadFile(uploadFormData);
          
          if (uploadResult.success) {
            // Save to database
            const receiptResult = await saveReceiptToDatabase(debtId, uploadResult.data);
            
            if (receiptResult.success) {
              uploadedReceipts.push(receiptResult.data);
            } else {
              errors.push(`${file.name}: ${receiptResult.error}`);
            }
          } else {
            errors.push(`${file.name}: ${uploadResult.error}`);
          }
        } catch (error) {
          errors.push(`${file.name}: ${error.message}`);
        }
      }
    }

    return {
      success: true,
      data: {
        uploaded: uploadedReceipts,
        errors: errors,
        totalUploaded: uploadedReceipts.length,
        totalErrors: errors.length
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}