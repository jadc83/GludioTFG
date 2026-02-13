Vagrant.configure("2") do |config|
  config.vm.box = "debian/bookworm64"

  # Hostname
  config.vm.hostname = "hotelgludio"

  # Red exposición (centro)
  config.vm.network "public_network", ip: "192.168.1.120", netmask: "255.255.255.0"

  # Red pruebas local
  config.vm.network "private_network", ip: "192.168.56.10"

  # Carpeta sincronizada: ajusta la ruta si la cambias en Windows
  config.vm.synced_folder "C:/Users/ohayo/Documents/GludioTFG", "/var/www/hotelgludio", type: "virtualbox", owner: "vagrant", group: "vagrant"

  config.vm.provider "virtualbox" do |vb|
    vb.memory = 3072
    vb.cpus = 2
  end

  config.vm.provision "shell", inline: <<-'SHELL'
    export DEBIAN_FRONTEND=noninteractive

    apt update -y
    apt upgrade -y

    apt install -y \
      git curl unzip gnupg2 ca-certificates openssl \
      apache2 bind9 proftpd-basic \
      postgresql-15 postgresql-client-15 postgresql-contrib \
      software-properties-common

    # Añadir repositorio de paquetes PHP (sury) y actualizar
    apt install -y ca-certificates lsb-release apt-transport-https wget gnupg2
    wget -qO - https://packages.sury.org/php/apt.gpg | tee /etc/apt/trusted.gpg.d/sury-php.gpg
    echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list
    apt update

    apt install -y \
      php8.5 php8.5-cli libapache2-mod-php8.5 \
      php8.5-pgsql php8.5-mbstring php8.5-xml \
      php8.5-curl php8.5-gd php8.5-zip \
      php8.5-intl php8.5-bcmath

    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer

    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs

    # Crear DB y usuario para el proyecto
    sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS hotelgludio;
DROP ROLE IF EXISTS hotelgludio;
CREATE ROLE hotelgludio LOGIN PASSWORD 'hotelgludio';
CREATE DATABASE hotelgludio OWNER hotelgludio;
EOF
    ####################################################
    cd /var/www/hotelgludio || exit 0
    # Instalar dependencias PHP
    composer install --no-dev --optimize-autoloader || true

    # Preparar .env
    if [ -f .env.example ]; then
      cp .env.example .env
    fi

    # CONFIG DB en .env
    grep -q "DB_CONNECTION=pgsql" .env || printf "\nDB_CONNECTION=pgsql\nDB_HOST=127.0.0.1\nDB_PORT=5432\nDB_DATABASE=hotelgludio\nDB_USERNAME=hotelgludio\nDB_PASSWORD=hotelgludio\n" >> .env

    # Generar key y preparar storage
    php artisan key:generate || true

    mkdir -p storage/logs
    mkdir -p storage/app/public

    chown -R www-data:www-data /var/www/hotelgludio || true
    chmod -R 775 storage bootstrap/cache || true

    # enlace storage público
    sudo -u www-data php artisan storage:link || true

    composer require fakerphp/faker --no-update || true
    composer update fakerphp/faker --ignore-platform-reqs || true

    # Ejecutar migraciones y seed como www-data
    sudo -u www-data php artisan migrate --force || true
    sudo -u www-data php artisan db:seed --force || true

    # Node/build
    npm install || true
    npm run build || true

    chown -R www-data:www-data /var/www/hotelgludio || true

    ####################################################
    # CONFIGURACIÓN SSL Y APACHE
    ####################################################
    a2enmod rewrite headers ssl proxy proxy_wstunnel proxy_http || true

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/ssl/private/hotelgludio.key \
      -out /etc/ssl/certs/hotelgludio.crt \
      -subj "/C=ES/ST=Cadiz/L=Sanlucar/O=HotelGludio/OU=IT/CN=hotelgludio.es"

    cat > /etc/apache2/sites-available/hotelgludio.conf <<APACHE
<VirtualHost *:80>
  ServerName hotelgludio.es
  ServerAlias www.hotelgludio.es
  Redirect permanent / https://hotelgludio.es/
</VirtualHost>

<VirtualHost *:443>
  ServerName hotelgludio.es
  ServerAlias www.hotelgludio.es
  DocumentRoot /var/www/hotelgludio/public

  SSLEngine on
  SSLCertificateFile /etc/ssl/certs/hotelgludio.crt
  SSLCertificateKeyFile /etc/ssl/private/hotelgludio.key

  <Directory /var/www/hotelgludio/public>
    AllowOverride All
    Require all granted
    Options -Indexes
  </Directory>

  # Proxy settings for Reverb (WebSocket secure termination via Apache)
  ProxyPreserveHost On
  ProxyRequests Off

  # Proxy WebSocket endpoint (adjust path if Reverb uses a different route)
  ProxyPass /ws/ ws://127.0.0.1:8080/ws/
  ProxyPassReverse /ws/ ws://127.0.0.1:8080/ws/

  # Proxy HTTP API/handshake for Reverb
  ProxyPass /reverb/ http://127.0.0.1:8080/reverb/
  ProxyPassReverse /reverb/ http://127.0.0.1:8080/reverb/

</VirtualHost>
APACHE

    a2dissite 000-default || true
    a2ensite hotelgludio || true
    systemctl restart apache2 || true

    ####################################################
    # DNS (Bind9) - zona local
    ####################################################
    cat >> /etc/bind/named.conf.local <<'EOF'
zone "hotelgludio.es" {
  type master;
  file "/etc/bind/db.hotelgludio";
};
zone "1.168.192.in-addr.arpa" {
  type master;
  file "/etc/bind/db.reverse";
};
EOF

    cat > /etc/bind/db.hotelgludio <<'EOF'
$TTL 604800
@ IN SOA ns.hotelgludio.es. root.hotelgludio.es. (
  3 604800 86400 2419200 604800 )
@ IN NS ns.hotelgludio.es.
ns IN A 192.168.1.120
@ IN A 192.168.1.120
www IN A 192.168.1.120
EOF

    cat > /etc/bind/db.reverse <<'EOF'
$TTL 604800
@ IN SOA ns.hotelgludio.es. root.hotelgludio.es. (
  2 604800 86400 2419200 604800 )
@ IN NS ns.hotelgludio.es.
120 IN PTR hotelgludio.es.
EOF

    systemctl restart bind9 || true

    ####################################################
    # FTP (ProFTPD) - usuario simple
    ####################################################
    ftpasswd --passwd \
      --name vagrantftp \
      --uid 2001 \
      --gid 2001 \
      --home /home/vagrantftp \
      --shell /bin/false \
      --file /etc/proftpd/ftpd.passwd --stdin <<'EOF'
vagrant
vagrant
EOF

    grep -qxF "AuthUserFile /etc/proftpd/ftpd.passwd" /etc/proftpd/proftpd.conf || echo "AuthUserFile /etc/proftpd/ftpd.passwd" >> /etc/proftpd/proftpd.conf
    grep -qxF "RequireValidShell off" /etc/proftpd/proftpd.conf || echo "RequireValidShell off" >> /etc/proftpd/proftpd.conf
    grep -qxF "DefaultRoot ~" /etc/proftpd/proftpd.conf || echo "DefaultRoot ~" >> /etc/proftpd/proftpd.conf

    systemctl restart proftpd || true

    echo "DEPLOYMENT COMPLETE - HTTPS ENABLED"
  SHELL
end
