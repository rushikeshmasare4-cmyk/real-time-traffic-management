cmake_minimum_required(VERSION 3.15)
project(Flowgrid VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(MSVC)
    add_compile_options(/W4 /EHsc)
else()
    add_compile_options(-Wall -Wextra -pedantic)
endif()

include_directories(include)

# Core Simulation Source Files
set(CORE_SOURCES
    src/Vehicle.cpp
    src/VehicleQueue.cpp
    src/RoadNetwork.cpp
    src/TrafficSignal.cpp
    src/Statistics.cpp
    src/TrafficManager.cpp
    src/HttpServer.cpp
)

# 1. Main Terminal Application
add_executable(flowgrid
    src/main.cpp
    ${CORE_SOURCES}
)

# 2. Web Server Host Application (C++ Backend for Web Frontend)
add_executable(flowgrid_server
    src/server_main.cpp
    ${CORE_SOURCES}
)

# 3. Automated Test Suite
add_executable(flowgrid_tests
    tests/tests.cpp
    ${CORE_SOURCES}
)

# Link Windows Socket Library (ws2_32) on Windows
if(WIN32)
    target_link_libraries(flowgrid ws2_32)
    target_link_libraries(flowgrid_server ws2_32)
    target_link_libraries(flowgrid_tests ws2_32)
endif()

enable_testing()
add_test(NAME FlowgridVerificationTests COMMAND flowgrid_tests)
