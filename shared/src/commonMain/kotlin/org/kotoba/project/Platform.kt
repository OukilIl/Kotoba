package org.kotoba.project

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform