<?php

use PHPUnit\Framework\TestCase;

class PrecioServiceTest extends TestCase {
    // previous test code...

    public function testGetModPrecioOnHoliday() {
        $precioService = new PrecioService(); // Replace with the actual constructor

        // Known holiday date
        $holidayDate = '2026-01-01';
        // Known regular date
        $regularDate = '2026-02-02';

        // Test holiday price modifier (should be 1.5x)
        $holidayPriceModifier = $precioService->getModPrecio($holidayDate);
        $this->assertGreaterThan(1, $holidayPriceModifier);
        $this->assertEquals(1.5, $holidayPriceModifier);

        // Test regular date price modifier (should be lower than holiday price modifier)
        $regularPriceModifier = $precioService->getModPrecio($regularDate);
        $this->assertLessThan($holidayPriceModifier, $regularPriceModifier);
    }
}