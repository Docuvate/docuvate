//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_paperless_installation_request_dto.g.dart';

/// UpdatePaperlessInstallationRequestDto
///
/// Properties:
/// * [displayName] 
/// * [credentials] 
/// * [keepOcrText] 
/// * [rerunOcr] 
/// * [includeArchivedPdf] 
@BuiltValue()
abstract class UpdatePaperlessInstallationRequestDto implements Built<UpdatePaperlessInstallationRequestDto, UpdatePaperlessInstallationRequestDtoBuilder> {
  @BuiltValueField(wireName: r'displayName')
  String? get displayName;

  @BuiltValueField(wireName: r'credentials')
  BuiltMap<String, String>? get credentials;

  @BuiltValueField(wireName: r'keepOcrText')
  bool? get keepOcrText;

  @BuiltValueField(wireName: r'rerunOcr')
  bool? get rerunOcr;

  @BuiltValueField(wireName: r'includeArchivedPdf')
  bool? get includeArchivedPdf;

  UpdatePaperlessInstallationRequestDto._();

  factory UpdatePaperlessInstallationRequestDto([void updates(UpdatePaperlessInstallationRequestDtoBuilder b)]) = _$UpdatePaperlessInstallationRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdatePaperlessInstallationRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdatePaperlessInstallationRequestDto> get serializer => _$UpdatePaperlessInstallationRequestDtoSerializer();
}

class _$UpdatePaperlessInstallationRequestDtoSerializer implements PrimitiveSerializer<UpdatePaperlessInstallationRequestDto> {
  @override
  final Iterable<Type> types = const [UpdatePaperlessInstallationRequestDto, _$UpdatePaperlessInstallationRequestDto];

  @override
  final String wireName = r'UpdatePaperlessInstallationRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdatePaperlessInstallationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.displayName != null) {
      yield r'displayName';
      yield serializers.serialize(
        object.displayName,
        specifiedType: const FullType(String),
      );
    }
    if (object.credentials != null) {
      yield r'credentials';
      yield serializers.serialize(
        object.credentials,
        specifiedType: const FullType(BuiltMap, [FullType(String), FullType(String)]),
      );
    }
    if (object.keepOcrText != null) {
      yield r'keepOcrText';
      yield serializers.serialize(
        object.keepOcrText,
        specifiedType: const FullType(bool),
      );
    }
    if (object.rerunOcr != null) {
      yield r'rerunOcr';
      yield serializers.serialize(
        object.rerunOcr,
        specifiedType: const FullType(bool),
      );
    }
    if (object.includeArchivedPdf != null) {
      yield r'includeArchivedPdf';
      yield serializers.serialize(
        object.includeArchivedPdf,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdatePaperlessInstallationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdatePaperlessInstallationRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        case r'credentials':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType(String)]),
          ) as BuiltMap<String, String>;
          result.credentials.replace(valueDes);
          break;
        case r'keepOcrText':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.keepOcrText = valueDes;
          break;
        case r'rerunOcr':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.rerunOcr = valueDes;
          break;
        case r'includeArchivedPdf':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.includeArchivedPdf = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdatePaperlessInstallationRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdatePaperlessInstallationRequestDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

