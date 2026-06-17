package com.immiscale.metaengine

import android.app.Application

class ImmiScaleApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Inicialización de la app
        // En producción: inyección de dependencias, Firebase, etc.
    }
}
