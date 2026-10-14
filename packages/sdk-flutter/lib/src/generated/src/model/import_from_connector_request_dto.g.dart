// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'import_from_connector_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ImportFromConnectorRequestDto extends ImportFromConnectorRequestDto {
  @override
  final String ref;

  factory _$ImportFromConnectorRequestDto(
          [void Function(ImportFromConnectorRequestDtoBuilder)? updates]) =>
      (ImportFromConnectorRequestDtoBuilder()..update(updates))._build();

  _$ImportFromConnectorRequestDto._({required this.ref}) : super._();
  @override
  ImportFromConnectorRequestDto rebuild(
          void Function(ImportFromConnectorRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ImportFromConnectorRequestDtoBuilder toBuilder() =>
      ImportFromConnectorRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ImportFromConnectorRequestDto && ref == other.ref;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, ref.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ImportFromConnectorRequestDto')
          ..add('ref', ref))
        .toString();
  }
}

class ImportFromConnectorRequestDtoBuilder
    implements
        Builder<ImportFromConnectorRequestDto,
            ImportFromConnectorRequestDtoBuilder> {
  _$ImportFromConnectorRequestDto? _$v;

  String? _ref;
  String? get ref => _$this._ref;
  set ref(String? ref) => _$this._ref = ref;

  ImportFromConnectorRequestDtoBuilder() {
    ImportFromConnectorRequestDto._defaults(this);
  }

  ImportFromConnectorRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _ref = $v.ref;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ImportFromConnectorRequestDto other) {
    _$v = other as _$ImportFromConnectorRequestDto;
  }

  @override
  void update(void Function(ImportFromConnectorRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ImportFromConnectorRequestDto build() => _build();

  _$ImportFromConnectorRequestDto _build() {
    final _$result = _$v ??
        _$ImportFromConnectorRequestDto._(
          ref: BuiltValueNullFieldError.checkNotNull(
              ref, r'ImportFromConnectorRequestDto', 'ref'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
