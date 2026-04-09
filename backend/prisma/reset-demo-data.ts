import { PrismaClient, StoppagePriority, StoppageStatus } from '@prisma/client';

const prisma = new PrismaClient();
const tenantId = 'demo_tenant';

const sitesSeed = [
  { name: 'Milano Nord', address: 'Via Stelvio 12', city: 'Milano' },
  { name: 'Torino Centro', address: 'Corso Francia 81', city: 'Torino' },
  { name: 'Roma Est', address: 'Via Tiburtina 450', city: 'Roma' }
];

const workshopsSeed = [
  { name: 'Officina Rossi', city: 'Milano', address: 'Via Padova 20', email: 'rossi@officine.test' },
  { name: 'Tech Motors Torino', city: 'Torino', address: 'Via Cigna 9', email: 'techmotors@officine.test' },
  { name: 'Autolab Roma', city: 'Roma', address: 'Via Prenestina 210', email: 'autolab@officine.test' }
];

const vehiclesSeed = [
  { plate: 'GF100AA', brand: 'Iveco', model: 'Daily' },
  { plate: 'GF101AB', brand: 'Fiat', model: 'Ducato' },
  { plate: 'GF102AC', brand: 'Renault', model: 'Master' },
  { plate: 'GF103AD', brand: 'Ford', model: 'Transit' },
  { plate: 'GF104AE', brand: 'Mercedes', model: 'Sprinter' },
  { plate: 'GF105AF', brand: 'Volkswagen', model: 'Crafter' },
  { plate: 'GF106AG', brand: 'Peugeot', model: 'Boxer' },
  { plate: 'GF107AH', brand: 'Citroen', model: 'Jumper' },
  { plate: 'GF108AJ', brand: 'Nissan', model: 'NV400' },
  { plate: 'GF109AK', brand: 'Opel', model: 'Movano' }
];

const reasons = [
  'Guasto impianto frenante',
  'Anomalia centralina motore',
  'Sostituzione frizione urgente',
  'Perdita olio motore',
  'Guasto sistema raffreddamento',
  'Sostituzione pneumatici asse posteriore',
  'Anomalia impianto elettrico',
  'Controllo vibrazioni trasmissione',
  'Guasto alternatore',
  'Intervento su turbina'
];

const statuses: StoppageStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'SOLICITED',
  'OPEN',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'SOLICITED',
  'OPEN',
  'CLOSED'
];

const priorities: StoppagePriority[] = [
  'MEDIUM',
  'HIGH',
  'CRITICAL',
  'MEDIUM',
  'LOW',
  'HIGH',
  'MEDIUM',
  'CRITICAL',
  'LOW',
  'MEDIUM'
];

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error(`Tenant ${tenantId} non trovato`);

  const admin = await prisma.user.findFirst({ where: { tenantId, email: 'admin@demo.local', deletedAt: null } });
  if (!admin) throw new Error('Utente admin demo non trovato');

  await prisma.$transaction(async (tx) => {
    await tx.stoppageEvent.deleteMany({ where: { tenantId } });
    await tx.stoppagePhoto.deleteMany({ where: { stoppage: { tenantId } } });
    await tx.reminder.deleteMany({ where: { tenantId } });
    await tx.stoppage.deleteMany({ where: { tenantId } });
    await tx.vehiclePhoto.deleteMany({ where: { vehicle: { tenantId } } });
    await tx.vehicle.deleteMany({ where: { tenantId } });
    await tx.workshop.deleteMany({ where: { tenantId } });
    await tx.site.deleteMany({ where: { tenantId } });
    await tx.auditLog.deleteMany({ where: { tenantId } });
  });

  const sites: Array<{ id: string; name: string }> = [];
  for (const site of sitesSeed) {
    const created = await prisma.site.create({
      data: {
        tenantId,
        name: site.name,
        address: site.address,
        city: site.city,
        contactName: 'Referente Sede',
        email: `${site.city.toLowerCase()}@sedi.test`,
        phone: '+39 0200000000',
        isActive: true
      }
    });
    sites.push({ id: created.id, name: created.name });
  }

  const workshops: Array<{ id: string; name: string }> = [];
  for (const workshop of workshopsSeed) {
    const created = await prisma.workshop.create({
      data: {
        tenantId,
        name: workshop.name,
        city: workshop.city,
        address: workshop.address,
        email: workshop.email,
        phone: '+39 0300000000',
        whatsapp: '+393300000000',
        isActive: true
      }
    });
    workshops.push({ id: created.id, name: created.name });
  }

  const vehicles: Array<{ id: string; plate: string; siteId: string }> = [];
  for (let i = 0; i < vehiclesSeed.length; i += 1) {
    const v = vehiclesSeed[i];
    const site = sites[i % sites.length];
    const created = await prisma.vehicle.create({
      data: {
        tenantId,
        siteId: site.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: 2019 + (i % 5),
        currentKm: 85000 + i * 4700,
        maintenanceIntervalKm: 25000,
        notes: 'Dato demo fittizio',
        isActive: true
      }
    });
    vehicles.push({ id: created.id, plate: created.plate, siteId: created.siteId });
  }

  const now = new Date();
  const createdRows: Array<{ id: string; plate: string; status: string; site: string; workshop: string; openedAt: string }> = [];

  for (let i = 0; i < 10; i += 1) {
    const site = sites[i % sites.length];
    const workshop = workshops[i % workshops.length];
    const vehicle = vehicles[i];

    const openedAt = new Date(now.getTime() - (i * 4 + 1) * 24 * 60 * 60 * 1000);
    const status = statuses[i];
    const closedAt = status === 'CLOSED' ? new Date(openedAt.getTime() + 2 * 24 * 60 * 60 * 1000) : null;

    const stoppage = await prisma.stoppage.create({
      data: {
        tenantId,
        siteId: site.id,
        vehicleId: vehicle.id,
        workshopId: workshop.id,
        createdByUserId: admin.id,
        reason: reasons[i],
        notes: `Ticket demo #${i + 1}`,
        status,
        priority: priorities[i],
        assignedToUserId: admin.id,
        estimatedCostPerDay: 95 + i * 8,
        openedAt,
        closedAt,
        reminderAfterDays: i % 2 === 0 ? 3 : 7,
        workshopEmailSnapshot: `${workshop.name.toLowerCase().replace(/\s+/g, '.')}@officine.test`,
        workshopPhoneSnapshot: '+39 0300000000',
        workshopWhatsappSnapshot: '+393300000000'
      }
    });

    await prisma.stoppageEvent.create({
      data: {
        tenantId,
        stoppageId: stoppage.id,
        userId: admin.id,
        type: 'CREATED',
        message: 'Fermo creato da seed demo',
        payload: { seed: true, index: i + 1 }
      }
    });

    createdRows.push({
      id: stoppage.id,
      plate: vehicle.plate,
      status,
      site: site.name,
      workshop: workshop.name,
      openedAt: openedAt.toISOString()
    });
  }

  console.log('Pulizia completata: rimossi dati test precedenti tenant demo_tenant');
  console.log('Creati 10 fermi demo + anagrafiche correlate (3 sedi, 3 officine, 10 veicoli).');
  console.table(createdRows);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
