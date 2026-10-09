// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_typst_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LayoutTypstResponseDtoExportModeEnum
    _$layoutTypstResponseDtoExportModeEnum_exakt =
    const LayoutTypstResponseDtoExportModeEnum._('exakt');
const LayoutTypstResponseDtoExportModeEnum
    _$layoutTypstResponseDtoExportModeEnum_semantisch =
    const LayoutTypstResponseDtoExportModeEnum._('semantisch');

LayoutTypstResponseDtoExportModeEnum
    _$layoutTypstResponseDtoExportModeEnumValueOf(String name) {
  switch (name) {
    case 'exakt':
      return _$layoutTypstResponseDtoExportModeEnum_exakt;
    case 'semantisch':
      return _$layoutTypstResponseDtoExportModeEnum_semantisch;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<LayoutTypstResponseDtoExportModeEnum>
    _$layoutTypstResponseDtoExportModeEnumValues = new BuiltSet<
        LayoutTypstResponseDtoExportModeEnum>(const <LayoutTypstResponseDtoExportModeEnum>[
  _$layoutTypstResponseDtoExportModeEnum_exakt,
  _$layoutTypstResponseDtoExportModeEnum_semantisch,
]);

Serializer<LayoutTypstResponseDtoExportModeEnum>
    _$layoutTypstResponseDtoExportModeEnumSerializer =
    new _$LayoutTypstResponseDtoExportModeEnumSerializer();

class _$LayoutTypstResponseDtoExportModeEnumSerializer
    implements PrimitiveSerializer<LayoutTypstResponseDtoExportModeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'exakt': 'exakt',
    'semantisch': 'semantisch',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'exakt': 'exakt',
    'semantisch': 'semantisch',
  };

  @override
  final Iterable<Type> types = const <Type>[
    LayoutTypstResponseDtoExportModeEnum
  ];
  @override
  final String wireName = 'LayoutTypstResponseDtoExportModeEnum';

  @override
  Object serialize(
          Serializers serializers, LayoutTypstResponseDtoExportModeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  LayoutTypstResponseDtoExportModeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      LayoutTypstResponseDtoExportModeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$LayoutTypstResponseDto extends LayoutTypstResponseDto {
  @override
  final String typst;
  @override
  final LayoutTypstResponseDtoExportModeEnum exportMode;
  @override
  final bool reconstructionReliable;
  @override
  final String? unreliableReason;

  factory _$LayoutTypstResponseDto(
          [void Function(LayoutTypstResponseDtoBuilder)? updates]) =>
      (new LayoutTypstResponseDtoBuilder()..update(updates))._build();

  _$LayoutTypstResponseDto._(
      {required this.typst,
      required this.exportMode,
      required this.reconstructionReliable,
      this.unreliableReason})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        typst, r'LayoutTypstResponseDto', 'typst');
    BuiltValueNullFieldError.checkNotNull(
        exportMode, r'LayoutTypstResponseDto', 'exportMode');
    BuiltValueNullFieldError.checkNotNull(reconstructionReliable,
        r'LayoutTypstResponseDto', 'reconstructionReliable');
  }

  @override
  LayoutTypstResponseDto rebuild(
          void Function(LayoutTypstResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutTypstResponseDtoBuilder toBuilder() =>
      new LayoutTypstResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutTypstResponseDto &&
        typst == other.typst &&
        exportMode == other.exportMode &&
        reconstructionReliable == other.reconstructionReliable &&
        unreliableReason == other.unreliableReason;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, typst.hashCode);
    _$hash = $jc(_$hash, exportMode.hashCode);
    _$hash = $jc(_$hash, reconstructionReliable.hashCode);
    _$hash = $jc(_$hash, unreliableReason.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutTypstResponseDto')
          ..add('typst', typst)
          ..add('exportMode', exportMode)
          ..add('reconstructionReliable', reconstructionReliable)
          ..add('unreliableReason', unreliableReason))
        .toString();
  }
}

class LayoutTypstResponseDtoBuilder
    implements Builder<LayoutTypstResponseDto, LayoutTypstResponseDtoBuilder> {
  _$LayoutTypstResponseDto? _$v;

  String? _typst;
  String? get typst => _$this._typst;
  set typst(String? typst) => _$this._typst = typst;

  LayoutTypstResponseDtoExportModeEnum? _exportMode;
  LayoutTypstResponseDtoExportModeEnum? get exportMode => _$this._exportMode;
  set exportMode(LayoutTypstResponseDtoExportModeEnum? exportMode) =>
      _$this._exportMode = exportMode;

  bool? _reconstructionReliable;
  bool? get reconstructionReliable => _$this._reconstructionReliable;
  set reconstructionReliable(bool? reconstructionReliable) =>
      _$this._reconstructionReliable = reconstructionReliable;

  String? _unreliableReason;
  String? get unreliableReason => _$this._unreliableReason;
  set unreliableReason(String? unreliableReason) =>
      _$this._unreliableReason = unreliableReason;

  LayoutTypstResponseDtoBuilder() {
    LayoutTypstResponseDto._defaults(this);
  }

  LayoutTypstResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _typst = $v.typst;
      _exportMode = $v.exportMode;
      _reconstructionReliable = $v.reconstructionReliable;
      _unreliableReason = $v.unreliableReason;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutTypstResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$LayoutTypstResponseDto;
  }

  @override
  void update(void Function(LayoutTypstResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutTypstResponseDto build() => _build();

  _$LayoutTypstResponseDto _build() {
    final _$result = _$v ??
        new _$LayoutTypstResponseDto._(
            typst: BuiltValueNullFieldError.checkNotNull(
                typst, r'LayoutTypstResponseDto', 'typst'),
            exportMode: BuiltValueNullFieldError.checkNotNull(
                exportMode, r'LayoutTypstResponseDto', 'exportMode'),
            reconstructionReliable: BuiltValueNullFieldError.checkNotNull(
                reconstructionReliable,
                r'LayoutTypstResponseDto',
                'reconstructionReliable'),
            unreliableReason: unreliableReason);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
