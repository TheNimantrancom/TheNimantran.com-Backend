import { Server, Socket } from "socket.io"

const warehouseSocketMap = new Map<string, string>()
const userSocketMap = new Map<string, string>()

export const initWarehouseSocket = (socket: Socket, io: Server) => {

  console.log("[Socket] Started socket:", socket.id)

  socket.on("REGISTER_WAREHOUSE", ({ warehouseId }: { warehouseId: string }) => {
    if (!warehouseId) return

    const prev = warehouseSocketMap.get(warehouseId)

    if (prev) {
      const prevSocket = io.sockets.sockets.get(prev)
      prevSocket?.leave(warehouseId)
    }

    socket.join(warehouseId)
    warehouseSocketMap.set(warehouseId, socket.id)

    console.log(`[Socket] Warehouse ${warehouseId} joined room`)
  })

  socket.on("REGISTER_USER", ({ userId }: { userId: string }) => {
    if (!userId) return

    socket.join(userId)
    userSocketMap.set(userId, socket.id)

    console.log(`[Socket] User ${userId} joined room`)
  })

  socket.on("disconnect", () => {

    for (const [wId, sId] of warehouseSocketMap.entries()) {
      if (sId === socket.id) {
        warehouseSocketMap.delete(wId)
        console.log(`[Socket] Warehouse ${wId} disconnected`)
      }
    }

    for (const [uId, sId] of userSocketMap.entries()) {
      if (sId === socket.id) {
        userSocketMap.delete(uId)
      }
    }

    console.log(`[Socket] Client disconnected: ${socket.id}`)
  })
}

export { warehouseSocketMap, userSocketMap }